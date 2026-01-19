import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { Task, TaskStatus, Priority, Prisma } from '../../../generated/prisma';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  parentId?: string;
  assigneeId?: string;
  recordId?: string;
  startDate?: Date;
  dueDate?: Date;
  timeEstimate?: number;
  labels?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  startDate?: Date;
  dueDate?: Date;
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
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    // Calculate position (at the end of the list)
    const maxPosition = await this.prisma.task.aggregate({
      where: {
        projectId: dto.projectId || null,
        status: dto.status || TaskStatus.TODO,
      },
      _max: { position: true },
    });

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
        startDate: dto.startDate,
        dueDate: dto.dueDate,
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

    this.logger.log('Task created', { taskId: task.id, projectId: dto.projectId, userId });

    return task;
  }

  async findAll(query: QueryTasksDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 100;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

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
          project: { select: { id: true, name: true, color: true } },
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
        project: { select: { id: true, name: true, color: true } },
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

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const existing = await this.findOne(id);
    const statusChanged = dto.status && dto.status !== existing.status;

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        completedAt: dto.status === TaskStatus.DONE ? new Date() : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true, files: true } },
      },
    });

    // Update project progress if status changed
    if (statusChanged && existing.projectId) {
      await this.projectsService.updateProgress(existing.projectId);
    }

    this.logger.log('Task updated', { taskId: id, userId });

    return task;
  }

  async remove(id: string, hard = false): Promise<void> {
    const task = await this.findOne(id);

    if (hard) {
      await this.prisma.task.delete({ where: { id } });
      this.logger.log('Task hard deleted', { taskId: id });
    } else {
      await this.prisma.task.update({
        where: { id },
        data: { isArchived: true },
      });
      this.logger.log('Task archived', { taskId: id });
    }

    // Update project progress
    if (task.projectId) {
      await this.projectsService.updateProgress(task.projectId);
    }
  }

  async moveTask(id: string, newStatus: TaskStatus, newPosition: number): Promise<Task> {
    const task = await this.findOne(id);

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

    return this.prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        position: newPosition,
        completedAt: newStatus === TaskStatus.DONE ? new Date() : null,
      },
    });
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
}
