import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationService } from './validation.service';
import { WorkflowEngineService, TriggerContext } from '../workflows/workflow-engine.service';
import { CreateRecordDto, UpdateRecordDto, QueryRecordsDto } from './dto';
import { Record as CrmRecord, Prisma, ActivityType, WorkflowTrigger } from '../../../generated/prisma';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
    @Inject(forwardRef(() => WorkflowEngineService))
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  /**
   * Create a new record
   */
  async create(dto: CreateRecordDto, userId: string): Promise<CrmRecord> {
    // Get object with fields
    const object = await this.prisma.object.findUnique({
      where: { id: dto.objectId },
      include: { fields: true },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${dto.objectId}" not found`);
    }

    // Validate data against field definitions
    this.validation.validateData(dto.data, object.fields);

    // Create record
    const record = await this.prisma.record.create({
      data: {
        objectId: dto.objectId,
        data: dto.data as Prisma.InputJsonValue,
        stage: dto.stage,
        ownerId: userId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        recordId: record.id,
        type: ActivityType.NOTE,
        title: 'Record created',
        userId,
      },
    });

    this.logger.log('Record created', {
      recordId: record.id,
      objectId: dto.objectId,
      userId,
    });

    // Execute workflow triggers asynchronously
    this.executeWorkflowTrigger(
      WorkflowTrigger.RECORD_CREATED,
      record,
      object,
      userId,
    ).catch((error) => {
      this.logger.error('Failed to execute RECORD_CREATED workflows', {
        recordId: record.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return record;
  }

  /**
   * Get all records with filtering, sorting, and pagination
   */
  async findAll(query: QueryRecordsDto): Promise<PaginatedResult<CrmRecord>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.RecordWhereInput = {};

    if (query.objectId) {
      where.objectId = query.objectId;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.stage) {
      where.stage = query.stage;
    }

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    // Search in data JSON - use raw SQL for PostgreSQL jsonb search
    if (query.search) {
      // Convert JSON to text and search case-insensitively
      const searchTerm = `%${query.search.toLowerCase()}%`;
      const searchCondition = Prisma.sql`LOWER("data"::text) LIKE ${searchTerm}`;

      // Get IDs of matching records first
      const matchingIds = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Record"
        WHERE ${query.objectId ? Prisma.sql`"objectId" = ${query.objectId} AND` : Prisma.empty}
        "isArchived" = false AND
        ${searchCondition}
      `;

      if (matchingIds.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      where.id = { in: matchingIds.map(r => r.id) };
    }

    // Apply custom filters - search specific field value
    if (query.filters && Object.keys(query.filters).length > 0) {
      const filterKey = Object.keys(query.filters)[0];
      const filterValue = query.filters[filterKey];
      where.data = {
        path: [filterKey],
        equals: filterValue as Prisma.InputJsonValue,
      };
    }

    // Determine sort order
    let orderBy: Prisma.RecordOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy) {
      if (['createdAt', 'updatedAt', 'score'].includes(query.sortBy)) {
        orderBy = { [query.sortBy]: query.sortOrder || 'desc' };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          object: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
              color: true,
            },
          },
          _count: {
            select: {
              activities: true,
              comments: true,
              files: true,
              tasks: true,
            },
          },
        },
      }),
      this.prisma.record.count({ where }),
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

  /**
   * Get record by ID
   */
  async findOne(id: string, include?: string[]): Promise<CrmRecord> {
    const includeOptions: Prisma.RecordInclude = {
      object: {
        include: {
          fields: {
            orderBy: { position: 'asc' },
          },
        },
      },
    };

    if (include?.includes('activities')) {
      includeOptions.activities = {
        orderBy: { occurredAt: 'desc' },
        take: 20,
      };
    }

    if (include?.includes('comments')) {
      includeOptions.comments = {
        orderBy: { createdAt: 'desc' },
        take: 20,
      };
    }

    if (include?.includes('files')) {
      includeOptions.files = {
        orderBy: { createdAt: 'desc' },
      };
    }

    if (include?.includes('tasks')) {
      includeOptions.tasks = {
        orderBy: { createdAt: 'desc' },
        where: { isArchived: false },
      };
    }

    if (include?.includes('relations')) {
      includeOptions.relations = {
        include: {
          toRecord: {
            include: {
              object: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  icon: true,
                },
              },
            },
          },
        },
      };
      includeOptions.relatedTo = {
        include: {
          fromRecord: {
            include: {
              object: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  icon: true,
                },
              },
            },
          },
        },
      };
    }

    const record = await this.prisma.record.findUnique({
      where: { id },
      include: includeOptions,
    });

    if (!record) {
      throw new NotFoundException(`Record with ID "${id}" not found`);
    }

    return record;
  }

  /**
   * Update record
   */
  async update(id: string, dto: UpdateRecordDto, userId: string): Promise<CrmRecord> {
    const existing = await this.prisma.record.findUnique({
      where: { id },
      include: {
        object: {
          include: { fields: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Record with ID "${id}" not found`);
    }

    // Validate new data if provided
    if (dto.data) {
      // Merge with existing data
      const mergedData = { ...(existing.data as object), ...dto.data };
      this.validation.validateData(mergedData, existing.object.fields);
    }

    // Track stage change for activity
    const stageChanged = dto.stage && dto.stage !== existing.stage;

    // Update record
    const updateData: Prisma.RecordUpdateInput = {
      updatedBy: userId,
    };

    if (dto.data) {
      updateData.data = { ...(existing.data as object), ...dto.data } as Prisma.InputJsonValue;
    }

    if (dto.stage !== undefined) {
      updateData.stage = dto.stage;
    }

    if (dto.ownerId !== undefined) {
      updateData.ownerId = dto.ownerId;
    }

    if (dto.isArchived !== undefined) {
      updateData.isArchived = dto.isArchived;
    }

    const record = await this.prisma.record.update({
      where: { id },
      data: updateData,
    });

    // Create activity for stage change
    if (stageChanged) {
      await this.prisma.activity.create({
        data: {
          recordId: record.id,
          type: ActivityType.STAGE_CHANGED,
          title: `Stage changed to ${dto.stage}`,
          metadata: {
            previousStage: existing.stage,
            newStage: dto.stage,
          } as Prisma.InputJsonValue,
          userId,
        },
      });
    } else if (dto.data) {
      await this.prisma.activity.create({
        data: {
          recordId: record.id,
          type: ActivityType.FIELD_UPDATED,
          title: 'Record updated',
          metadata: {
            updatedFields: Object.keys(dto.data),
          } as Prisma.InputJsonValue,
          userId,
        },
      });
    }

    this.logger.log('Record updated', { recordId: id, userId });

    // Build changes object for workflow triggers
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (dto.data) {
      const existingData = existing.data as Record<string, unknown>;
      const newData = record.data as Record<string, unknown>;
      for (const key of Object.keys(dto.data)) {
        changes[key] = {
          old: existingData[key],
          new: newData[key],
        };
      }
    }
    if (stageChanged) {
      changes['stage'] = {
        old: existing.stage,
        new: dto.stage,
      };
    }

    // Execute workflow triggers asynchronously
    const triggerPromises: Promise<unknown>[] = [];

    // RECORD_UPDATED trigger
    triggerPromises.push(
      this.executeWorkflowTrigger(
        WorkflowTrigger.RECORD_UPDATED,
        record,
        { id: existing.object.id, name: existing.object.name, displayName: existing.object.displayName },
        userId,
        { changes },
      ),
    );

    // STAGE_CHANGED trigger
    if (stageChanged && dto.stage) {
      triggerPromises.push(
        this.executeWorkflowTrigger(
          WorkflowTrigger.STAGE_CHANGED,
          record,
          { id: existing.object.id, name: existing.object.name, displayName: existing.object.displayName },
          userId,
          { stage: { old: existing.stage || '', new: dto.stage } },
        ),
      );
    }

    // FIELD_CHANGED triggers for each changed field
    if (dto.data) {
      const existingData = existing.data as Record<string, unknown>;
      for (const [fieldName, newValue] of Object.entries(dto.data)) {
        const oldValue = existingData[fieldName];
        if (oldValue !== newValue) {
          triggerPromises.push(
            this.executeWorkflowTrigger(
              WorkflowTrigger.FIELD_CHANGED,
              record,
              { id: existing.object.id, name: existing.object.name, displayName: existing.object.displayName },
              userId,
              { field: { name: fieldName, old: oldValue, new: newValue } },
            ),
          );
        }
      }
    }

    // Execute all triggers (don't wait for completion)
    Promise.all(triggerPromises).catch((error) => {
      this.logger.error('Failed to execute update workflows', {
        recordId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return record;
  }

  /**
   * Delete record (soft delete)
   */
  async remove(id: string, userId: string, hard = false): Promise<void> {
    const existing = await this.prisma.record.findUnique({
      where: { id },
      include: {
        object: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Record with ID "${id}" not found`);
    }

    if (hard) {
      // Execute RECORD_DELETED trigger before deletion
      this.executeWorkflowTrigger(
        WorkflowTrigger.RECORD_DELETED,
        existing,
        existing.object,
        userId,
      ).catch((error) => {
        this.logger.error('Failed to execute RECORD_DELETED workflows', {
          recordId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      await this.prisma.record.delete({
        where: { id },
      });
      this.logger.log('Record hard deleted', { recordId: id });
    } else {
      await this.prisma.record.update({
        where: { id },
        data: { isArchived: true },
      });
      this.logger.log('Record archived', { recordId: id });
    }
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(
    ids: string[],
    data: Record<string, unknown>,
    userId: string,
  ): Promise<{ updated: number }> {
    const result = await this.prisma.record.updateMany({
      where: { id: { in: ids } },
      data: {
        data: data as Prisma.InputJsonValue,
        updatedBy: userId,
      },
    });

    this.logger.log('Bulk update completed', {
      count: result.count,
      userId,
    });

    return { updated: result.count };
  }

  /**
   * Bulk delete records
   */
  async bulkDelete(ids: string[], hard = false): Promise<{ deleted: number }> {
    if (hard) {
      const result = await this.prisma.record.deleteMany({
        where: { id: { in: ids } },
      });
      return { deleted: result.count };
    } else {
      const result = await this.prisma.record.updateMany({
        where: { id: { in: ids } },
        data: { isArchived: true },
      });
      return { deleted: result.count };
    }
  }

  /**
   * Execute workflow trigger asynchronously
   */
  private async executeWorkflowTrigger(
    trigger: WorkflowTrigger,
    record: CrmRecord,
    object: { id: string; name: string; displayName: string },
    userId: string,
    extra?: {
      changes?: Record<string, { old: unknown; new: unknown }>;
      field?: { name: string; old: unknown; new: unknown };
      stage?: { old: string; new: string };
    },
  ): Promise<void> {
    try {
      // Get user info for context
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        this.logger.warn('User not found for workflow context', { userId });
        return;
      }

      const context: TriggerContext = {
        trigger,
        record: record as TriggerContext['record'],
        object,
        user,
        changes: extra?.changes,
        field: extra?.field,
        stage: extra?.stage,
      };

      await this.workflowEngine.executeTrigger(context);
    } catch (error) {
      this.logger.error('Workflow trigger execution failed', {
        trigger,
        recordId: record.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
