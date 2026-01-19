import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus, Priority, Prisma } from '../../../generated/prisma';

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: Date;
  dueDate?: Date;
  recordId?: string;
  teamIds?: string[];
  budget?: number;
  timeEstimate?: number;
  color?: string;
  emoji?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: Date;
  dueDate?: Date;
  recordId?: string;
  teamIds?: string[];
  progress?: number;
  budget?: number;
  timeEstimate?: number;
  color?: string;
  emoji?: string;
  isArchived?: boolean;
}

export interface QueryProjectsDto {
  status?: ProjectStatus;
  ownerId?: string;
  includeArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status || ProjectStatus.PLANNING,
        priority: dto.priority || Priority.MEDIUM,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        recordId: dto.recordId,
        ownerId: userId,
        teamIds: dto.teamIds || [],
        budget: dto.budget,
        timeEstimate: dto.timeEstimate,
        color: dto.color,
        emoji: dto.emoji,
        createdBy: userId,
      },
      include: {
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    // Add creator as owner member
    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: 'OWNER',
      },
    });

    this.logger.log('Project created', { projectId: project.id, userId });

    return project;
  }

  async findAll(query: QueryProjectsDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      OR: [
        { ownerId: userId },
        { teamIds: { has: userId } },
        { members: { some: { userId } } },
      ],
    };

    if (query.status) {
      where.status = query.status;
    }

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { tasks: true, members: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        sprints: { orderBy: { startDate: 'asc' } },
        _count: {
          select: { tasks: true, comments: true, files: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    this.logger.log('Project updated', { projectId: id });

    return project;
  }

  async remove(id: string, hard = false): Promise<void> {
    await this.findOne(id);

    if (hard) {
      await this.prisma.project.delete({ where: { id } });
      this.logger.log('Project hard deleted', { projectId: id });
    } else {
      await this.prisma.project.update({
        where: { id },
        data: { isArchived: true },
      });
      this.logger.log('Project archived', { projectId: id });
    }
  }

  async updateProgress(id: string): Promise<void> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId: id, isArchived: false },
      select: { status: true },
    });

    if (tasks.length === 0) {
      return;
    }

    const completed = tasks.filter((t) => t.status === 'DONE').length;
    const progress = Math.round((completed / tasks.length) * 100);

    await this.prisma.project.update({
      where: { id },
      data: { progress },
    });
  }

  async addMember(projectId: string, userId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') {
    return this.prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      create: { projectId, userId, role },
      update: { role },
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  }
}
