import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Activity, ActivityType, Prisma } from '../../../generated/prisma';

export interface CreateActivityDto {
  recordId?: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface QueryActivitiesDto {
  recordId?: string;
  userId?: string;
  type?: ActivityType;
  page?: number;
  limit?: number;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityDto, userId: string): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        recordId: dto.recordId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        metadata: dto.metadata || {},
        occurredAt: dto.occurredAt || new Date(),
        userId,
      },
    });
  }

  async findAll(query: QueryActivitiesDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};

    if (query.recordId) {
      where.recordId = query.recordId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTimeline(recordId: string, limit = 50): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: { recordId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }
}
