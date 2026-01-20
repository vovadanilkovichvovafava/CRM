import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelationDto, QueryRelationsDto } from './dto';
import { RecordRelation, Prisma } from '../../../generated/prisma';

export interface RelationWithRecords extends RecordRelation {
  fromRecord: {
    id: string;
    objectId: string;
    data: Prisma.JsonValue;
    object: {
      id: string;
      name: string;
      displayName: string;
      icon: string | null;
      color: string | null;
    };
  };
  toRecord: {
    id: string;
    objectId: string;
    data: Prisma.JsonValue;
    object: {
      id: string;
      name: string;
      displayName: string;
      icon: string | null;
      color: string | null;
    };
  };
}

@Injectable()
export class RelationsService {
  private readonly logger = new Logger(RelationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new relation between records
   */
  async create(dto: CreateRelationDto): Promise<RelationWithRecords> {
    // Verify both records exist
    const [fromRecord, toRecord] = await Promise.all([
      this.prisma.record.findUnique({ where: { id: dto.fromRecordId } }),
      this.prisma.record.findUnique({ where: { id: dto.toRecordId } }),
    ]);

    if (!fromRecord) {
      throw new NotFoundException(`Record with ID "${dto.fromRecordId}" not found`);
    }

    if (!toRecord) {
      throw new NotFoundException(`Record with ID "${dto.toRecordId}" not found`);
    }

    // Prevent self-relations
    if (dto.fromRecordId === dto.toRecordId) {
      throw new BadRequestException('Cannot create relation to the same record');
    }

    // Check if relation already exists
    const existing = await this.prisma.recordRelation.findUnique({
      where: {
        fromRecordId_toRecordId_relationType: {
          fromRecordId: dto.fromRecordId,
          toRecordId: dto.toRecordId,
          relationType: dto.relationType,
        },
      },
    });

    if (existing) {
      throw new ConflictException('This relation already exists');
    }

    const relation = await this.prisma.recordRelation.create({
      data: {
        fromRecordId: dto.fromRecordId,
        toRecordId: dto.toRecordId,
        relationType: dto.relationType,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
      },
      include: {
        fromRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
        toRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
      },
    });

    this.logger.log('Relation created', {
      relationId: relation.id,
      from: dto.fromRecordId,
      to: dto.toRecordId,
      type: dto.relationType,
    });

    return relation as RelationWithRecords;
  }

  /**
   * Get all relations for a record
   */
  async findByRecord(
    recordId: string,
    query: QueryRelationsDto,
  ): Promise<RelationWithRecords[]> {
    const where: Prisma.RecordRelationWhereInput = {
      OR: [{ fromRecordId: recordId }, { toRecordId: recordId }],
    };

    if (query.relationType) {
      where.relationType = query.relationType;
    }

    const relations = await this.prisma.recordRelation.findMany({
      where,
      include: {
        fromRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
        toRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return relations as RelationWithRecords[];
  }

  /**
   * Get a single relation by ID
   */
  async findOne(id: string): Promise<RelationWithRecords> {
    const relation = await this.prisma.recordRelation.findUnique({
      where: { id },
      include: {
        fromRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
        toRecord: {
          include: {
            object: {
              select: { id: true, name: true, displayName: true, icon: true, color: true },
            },
          },
        },
      },
    });

    if (!relation) {
      throw new NotFoundException(`Relation with ID "${id}" not found`);
    }

    return relation as RelationWithRecords;
  }

  /**
   * Delete a relation
   */
  async remove(id: string): Promise<void> {
    const existing = await this.prisma.recordRelation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Relation with ID "${id}" not found`);
    }

    await this.prisma.recordRelation.delete({
      where: { id },
    });

    this.logger.log('Relation deleted', { relationId: id });
  }

  /**
   * Delete a relation by from/to/type (for convenience)
   */
  async removeByRecords(
    fromRecordId: string,
    toRecordId: string,
    relationType: string,
  ): Promise<void> {
    const existing = await this.prisma.recordRelation.findUnique({
      where: {
        fromRecordId_toRecordId_relationType: {
          fromRecordId,
          toRecordId,
          relationType,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Relation not found');
    }

    await this.prisma.recordRelation.delete({
      where: { id: existing.id },
    });

    this.logger.log('Relation deleted by records', { fromRecordId, toRecordId, relationType });
  }
}
