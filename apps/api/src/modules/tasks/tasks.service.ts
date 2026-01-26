import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../files/storage.service';
import { Task, TaskStatus, Priority, Prisma, File } from '../../../generated/prisma';

/**
 * Task role enum for permission checks
 * PROJECT_OWNER has the same permissions as CREATOR
 */
export enum TaskRole {
  CREATOR = 'creator',
  PROJECT_OWNER = 'project_owner',
  ASSIGNEE = 'assignee',
  VIEWER = 'viewer',
}

/**
 * Fields that assignee can update
 */
const ASSIGNEE_ALLOWED_FIELDS = ['status', 'timeSpent'] as const;

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  parentId?: string;
  assigneeId?: string;
  recordId?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  timeEstimate?: number;
  labels?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  timeEstimate?: number;
  position?: number;
  labels?: string[];
  isArchived?: boolean;
}

export interface QueryTasksDto {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: Priority;
  recordId?: string;
  parentId?: string;
  includeArchived?: boolean;
  includeSubtasks?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Transform file URLs to use current API_BASE_URL
   * This ensures URLs work correctly in both development and production
   */
  private async transformFileUrls<T extends { files?: File[] }>(task: T): Promise<T> {
    if (!task.files || task.files.length === 0) {
      return task;
    }

    const filesWithUrls = await Promise.all(
      task.files.map(async (file) => ({
        ...file,
        url: await this.storageService.getUrl(file.name),
      })),
    );

    return { ...task, files: filesWithUrls };
  }

  /**
   * Get user role for a task
   * Includes check for project owner (createdBy of the project)
   */
  getUserRole(
    task: {
      createdBy: string;
      assigneeId?: string | null;
      project?: { createdBy?: string } | null;
    },
    userId: string,
  ): TaskRole {
    if (task.createdBy === userId) {
      return TaskRole.CREATOR;
    }
    // Project owner has the same permissions as task creator
    if (task.project?.createdBy === userId) {
      return TaskRole.PROJECT_OWNER;
    }
    if (task.assigneeId === userId) {
      return TaskRole.ASSIGNEE;
    }
    return TaskRole.VIEWER;
  }

  /**
   * Check if user can update specific fields
   */
  validateUpdatePermissions(
    task: {
      createdBy: string;
      assigneeId?: string | null;
      project?: { createdBy?: string } | null;
    },
    dto: UpdateTaskDto,
    userId: string,
  ): void {
    const role = this.getUserRole(task, userId);

    // Creator and Project Owner can update everything
    if (role === TaskRole.CREATOR || role === TaskRole.PROJECT_OWNER) {
      return;
    }

    // Assignee can only update status and timeSpent
    if (role === TaskRole.ASSIGNEE) {
      const updateKeys = Object.keys(dto) as (keyof UpdateTaskDto)[];
      const disallowedFields = updateKeys.filter(
        (key) => !ASSIGNEE_ALLOWED_FIELDS.includes(key as (typeof ASSIGNEE_ALLOWED_FIELDS)[number]),
      );

      if (disallowedFields.length > 0) {
        throw new ForbiddenException(
          `Assignee can only update status and time spent. Cannot update: ${disallowedFields.join(', ')}`,
        );
      }
      return;
    }

    // Viewer cannot update anything
    throw new ForbiddenException('You do not have permission to update this task');
  }

  /**
   * Check if parent task can be marked as DONE
   * All subtasks must be DONE first
   */
  async validateParentStatusChange(taskId: string, newStatus: TaskStatus): Promise<void> {
    if (newStatus !== TaskStatus.DONE) {
      return;
    }

    const subtasks = await this.prisma.task.findMany({
      where: {
        parentId: taskId,
        isArchived: false,
      },
      select: { id: true, title: true, status: true },
    });

    const incompleteSubtasks = subtasks.filter((st) => st.status !== TaskStatus.DONE);

    if (incompleteSubtasks.length > 0) {
      const subtaskTitles = incompleteSubtasks.map((st) => st.title).join(', ');
      throw new BadRequestException(
        `Cannot mark task as DONE. ${incompleteSubtasks.length} subtask(s) are not completed: ${subtaskTitles}`,
      );
    }
  }

  /**
   * Convert string date to Date object if needed
   */
  private parseDate(date: Date | string | undefined): Date | undefined {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    // Calculate position (at the end of the list)
    const maxPosition = await this.prisma.task.aggregate({
      where: {
        projectId: dto.projectId || null,
        status: dto.status || TaskStatus.TODO,
      },
      _max: { position: true },
    });

    // Parse dates from string if needed
    const startDate = this.parseDate(dto.startDate);
    const dueDate = this.parseDate(dto.dueDate);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority || Priority.MEDIUM,
        projectId: dto.projectId,
        parentId: dto.parentId,
        assigneeId: dto.assigneeId,
        recordId: dto.recordId,
        startDate,
        dueDate,
        timeEstimate: dto.timeEstimate,
        labels: dto.labels || [],
        position: (maxPosition._max.position || 0) + 1,
        createdBy: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
        _count: { select: { subtasks: true, comments: true, files: true } },
      },
    });

    // Update project progress
    if (dto.projectId) {
      await this.projectsService.updateProgress(dto.projectId);
    }

    // Send notification if task is assigned to someone
    if (dto.assigneeId && dto.assigneeId !== userId) {
      await this.notificationsService.notifyTaskAssigned(
        dto.assigneeId,
        task.title,
        task.id,
        userId,
      );
    }

    this.logger.log('Task created', { taskId: task.id, projectId: dto.projectId, userId });

    return task;
  }

  async findAll(query: QueryTasksDto, userId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 100;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    // Visibility filter: user can only see their own tasks and tasks for their projects
    // Task is visible if:
    // 1. User created the task (createdBy)
    // 2. User is assigned to the task (assigneeId)
    // 3. User created the project (project.createdBy)
    where.OR = [
      { createdBy: userId },
      { assigneeId: userId },
      { project: { createdBy: userId } },
    ];

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.recordId) {
      where.recordId = query.recordId;
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId || null;
    }

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    if (!query.includeSubtasks && query.parentId === undefined) {
      where.parentId = null;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          project: { select: { id: true, name: true, color: true, createdBy: true } },
          parent: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { subtasks: true, comments: true, files: true, checklist: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, color: true, createdBy: true } },
        parent: { select: { id: true, title: true } },
        subtasks: {
          where: { isArchived: false },
          orderBy: { position: 'asc' },
        },
        checklist: { orderBy: { position: 'asc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        files: { orderBy: { createdAt: 'desc' } },
        dependencies: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
        dependents: {
          include: { task: { select: { id: true, title: true, status: true } } },
        },
        timeEntries: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Transform file URLs to use current API_BASE_URL
    return this.transformFileUrls(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    // Use findOne which transforms file URLs - we need the task data for validation
    const existing = await this.findOne(id);

    // Check user permissions
    this.validateUpdatePermissions(existing, dto, userId);

    // Check if status change to DONE is allowed (all subtasks must be DONE)
    if (dto.status && dto.status !== existing.status) {
      await this.validateParentStatusChange(id, dto.status);
    }

    const statusChanged = dto.status && dto.status !== existing.status;
    const assigneeChanged = dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId;

    // Parse dates from string if needed
    const updateData: Prisma.TaskUpdateInput = {
      ...dto,
      startDate: dto.startDate !== undefined ? this.parseDate(dto.startDate) : undefined,
      dueDate: dto.dueDate !== undefined ? this.parseDate(dto.dueDate) : undefined,
      completedAt: dto.status === TaskStatus.DONE ? new Date() : undefined,
    };

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true, files: true } },
      },
    });

    // Update project progress if status changed
    if (statusChanged && existing.projectId) {
      await this.projectsService.updateProgress(existing.projectId);
    }

    // Send notifications
    await this.sendTaskUpdateNotifications({
      task,
      existing,
      userId,
      statusChanged: statusChanged ?? false,
      assigneeChanged,
      newStatus: dto.status,
    });

    this.logger.log('Task updated', { taskId: id, userId, role: this.getUserRole(existing, userId) });

    return task;
  }

  /**
   * Send notifications when task is updated
   */
  private async sendTaskUpdateNotifications(params: {
    task: Task;
    existing: Task;
    userId: string;
    statusChanged: boolean;
    assigneeChanged: boolean;
    newStatus?: TaskStatus;
  }): Promise<void> {
    const { task, existing, userId, statusChanged, assigneeChanged, newStatus } = params;

    // Notify new assignee when task is assigned
    if (assigneeChanged && task.assigneeId && task.assigneeId !== userId) {
      await this.notificationsService.notifyTaskAssigned(
        task.assigneeId,
        task.title,
        task.id,
        userId,
      );
    }

    // Notify about status change
    if (statusChanged && newStatus) {
      const statusLabels: Record<TaskStatus, string> = {
        [TaskStatus.TODO]: 'To Do',
        [TaskStatus.IN_PROGRESS]: 'In Progress',
        [TaskStatus.IN_REVIEW]: 'In Review',
        [TaskStatus.BLOCKED]: 'Blocked',
        [TaskStatus.DONE]: 'Done',
        [TaskStatus.CANCELLED]: 'Cancelled',
      };

      // Notify creator if they didn't make the change
      if (existing.createdBy !== userId) {
        await this.notificationsService.create({
          userId: existing.createdBy,
          type: 'task_status_changed',
          title: 'Task status changed',
          message: `"${task.title}" was moved to ${statusLabels[newStatus]}`,
          data: { taskId: task.id, taskTitle: task.title, newStatus, changedBy: userId },
        });
      }

      // Notify assignee if they didn't make the change
      if (existing.assigneeId && existing.assigneeId !== userId && existing.assigneeId !== existing.createdBy) {
        await this.notificationsService.create({
          userId: existing.assigneeId,
          type: 'task_status_changed',
          title: 'Task status changed',
          message: `"${task.title}" was moved to ${statusLabels[newStatus]}`,
          data: { taskId: task.id, taskTitle: task.title, newStatus, changedBy: userId },
        });
      }
    }
  }

  async remove(id: string, userId: string, hard = false): Promise<void> {
    const task = await this.findOne(id);

    // Only creator or project owner can delete/archive tasks
    const role = this.getUserRole(task, userId);
    if (role !== TaskRole.CREATOR && role !== TaskRole.PROJECT_OWNER) {
      throw new ForbiddenException('Only the task creator or project owner can delete or archive this task');
    }

    if (hard) {
      await this.prisma.task.delete({ where: { id } });
      this.logger.log('Task hard deleted', { taskId: id, userId });
    } else {
      await this.prisma.task.update({
        where: { id },
        data: { isArchived: true },
      });
      this.logger.log('Task archived', { taskId: id, userId });
    }

    // Update project progress
    if (task.projectId) {
      await this.projectsService.updateProgress(task.projectId);
    }
  }

  async moveTask(id: string, newStatus: TaskStatus, newPosition: number, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    // Check permissions - creator and assignee can change status
    const role = this.getUserRole(task, userId);
    if (role === TaskRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to move this task');
    }

    // Check if status change to DONE is allowed (all subtasks must be DONE)
    if (newStatus !== task.status) {
      await this.validateParentStatusChange(id, newStatus);
    }

    // Update positions of other tasks
    await this.prisma.task.updateMany({
      where: {
        projectId: task.projectId,
        status: newStatus,
        position: { gte: newPosition },
        id: { not: id },
      },
      data: {
        position: { increment: 1 },
      },
    });

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        position: newPosition,
        completedAt: newStatus === TaskStatus.DONE ? new Date() : null,
      },
    });

    // Update project progress if status changed
    if (newStatus !== task.status && task.projectId) {
      await this.projectsService.updateProgress(task.projectId);
    }

    this.logger.log('Task moved', { taskId: id, userId, newStatus, newPosition });

    return updatedTask;
  }

  async addChecklistItem(taskId: string, title: string): Promise<void> {
    const maxPosition = await this.prisma.checklistItem.aggregate({
      where: { taskId },
      _max: { position: true },
    });

    await this.prisma.checklistItem.create({
      data: {
        taskId,
        title,
        position: (maxPosition._max.position || 0) + 1,
      },
    });
  }

  async toggleChecklistItem(itemId: string): Promise<void> {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });

    if (item) {
      await this.prisma.checklistItem.update({
        where: { id: itemId },
        data: { isCompleted: !item.isCompleted },
      });
    }
  }

  async deleteChecklistItem(itemId: string): Promise<void> {
    await this.prisma.checklistItem.delete({
      where: { id: itemId },
    });
  }

  async addDependency(taskId: string, dependsOnId: string, type: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED' = 'BLOCKS'): Promise<void> {
    await this.prisma.taskDependency.create({
      data: { taskId, dependsOnId, type },
    });
  }

  async removeDependency(taskId: string, dependsOnId: string): Promise<void> {
    await this.prisma.taskDependency.deleteMany({
      where: { taskId, dependsOnId },
    });
  }

  async getCalendarEvents(
    startDate: Date,
    endDate: Date,
    userId: string,
    projectId?: string,
  ): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {
      isArchived: false,
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { dueDate: { gte: endDate } },
          ],
        },
      ],
    };

    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });
  }
}
