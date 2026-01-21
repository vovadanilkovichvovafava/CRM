import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntry, Prisma } from '../../../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTimeEntryDto {
  taskId?: string;
  projectId?: string;
  recordId?: string;
  description?: string;
  duration: number; // minutes
  startTime: Date;
  endTime?: Date;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface UpdateTimeEntryDto {
  description?: string;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface QueryTimeEntriesDto {
  taskId?: string;
  projectId?: string;
  recordId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TimeStats {
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableAmount: number;
  entriesCount: number;
}

@Injectable()
export class TimeEntriesService {
  private readonly logger = new Logger(TimeEntriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTimeEntryDto, userId: string): Promise<TimeEntry> {
    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: dto.taskId,
        projectId: dto.projectId,
        recordId: dto.recordId,
        description: dto.description,
        duration: dto.duration,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isBillable: dto.isBillable || false,
        hourlyRate: dto.hourlyRate ? new Decimal(dto.hourlyRate) : null,
      },
      include: {
        task: { select: { id: true, title: true } },
        record: { select: { id: true, data: true } },
      },
    });

    this.logger.log('Time entry created', { entryId: entry.id, userId, duration: dto.duration });

    return entry;
  }

  async findAll(query: QueryTimeEntriesDto, userId: string): Promise<PaginatedResult<TimeEntry>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.TimeEntryWhereInput = { userId };

    if (query.taskId) {
      where.taskId = query.taskId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.recordId) {
      where.recordId = query.recordId;
    }

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = query.startDate;
      }
      if (query.endDate) {
        where.startTime.lte = query.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
        include: {
          task: { select: { id: true, title: true } },
          record: { select: { id: true, data: true } },
        },
      }),
      this.prisma.timeEntry.count({ where }),
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

  async findOne(id: string, userId: string): Promise<TimeEntry> {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, userId },
      include: {
        task: { select: { id: true, title: true } },
        record: { select: { id: true, data: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID "${id}" not found`);
    }

    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, userId: string): Promise<TimeEntry> {
    await this.findOne(id, userId);

    const entry = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        description: dto.description,
        duration: dto.duration,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isBillable: dto.isBillable,
        hourlyRate: dto.hourlyRate !== undefined ? new Decimal(dto.hourlyRate) : undefined,
      },
      include: {
        task: { select: { id: true, title: true } },
        record: { select: { id: true, data: true } },
      },
    });

    this.logger.log('Time entry updated', { entryId: id, userId });

    return entry;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.timeEntry.delete({ where: { id } });
    this.logger.log('Time entry deleted', { entryId: id, userId });
  }

  async getStats(userId: string, query?: { startDate?: Date; endDate?: Date }): Promise<TimeStats> {
    const where: Prisma.TimeEntryWhereInput = { userId };

    if (query?.startDate || query?.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = query.startDate;
      }
      if (query.endDate) {
        where.startTime.lte = query.endDate;
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      select: { duration: true, isBillable: true, hourlyRate: true },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
    const billableEntries = entries.filter((e) => e.isBillable);
    const billableMinutes = billableEntries.reduce((sum, e) => sum + e.duration, 0);

    let billableAmount = 0;
    for (const entry of billableEntries) {
      if (entry.hourlyRate) {
        const hours = entry.duration / 60;
        billableAmount += hours * Number(entry.hourlyRate);
      }
    }

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableMinutes,
      billableAmount: Math.round(billableAmount * 100) / 100,
      entriesCount: entries.length,
    };
  }

  async startTimer(userId: string, data: { taskId?: string; description?: string }): Promise<TimeEntry> {
    // Check if there's an active timer
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (activeTimer) {
      // Stop the active timer first
      await this.stopTimer(activeTimer.id, userId);
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: data.taskId,
        description: data.description,
        startTime: new Date(),
        duration: 0,
      },
      include: {
        task: { select: { id: true, title: true } },
      },
    });
  }

  async stopTimer(id: string, userId: string): Promise<TimeEntry> {
    const entry = await this.findOne(id, userId);

    if (entry.endTime) {
      throw new Error('Timer already stopped');
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);

    return this.prisma.timeEntry.update({
      where: { id },
      data: { endTime, duration },
      include: {
        task: { select: { id: true, title: true } },
      },
    });
  }

  async getActiveTimer(userId: string): Promise<TimeEntry | null> {
    return this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: {
        task: { select: { id: true, title: true } },
      },
    });
  }
}
