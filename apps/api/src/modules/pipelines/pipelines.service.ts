import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Pipeline, Prisma } from '../../../generated/prisma';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  probability?: number;
}

export interface CreatePipelineDto {
  name: string;
  objectId: string;
  stages: PipelineStage[];
  isDefault?: boolean;
}

export interface UpdatePipelineDto {
  name?: string;
  stages?: PipelineStage[];
  isDefault?: boolean;
  isArchived?: boolean;
}

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePipelineDto): Promise<Pipeline> {
    // Verify object exists
    const object = await this.prisma.object.findUnique({
      where: { id: dto.objectId },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${dto.objectId}" not found`);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { objectId: dto.objectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await this.prisma.pipeline.create({
      data: {
        name: dto.name,
        objectId: dto.objectId,
        stages: dto.stages as unknown as Prisma.InputJsonValue,
        isDefault: dto.isDefault || false,
      },
    });

    this.logger.log('Pipeline created', { pipelineId: pipeline.id, objectId: dto.objectId });

    return pipeline;
  }

  async findByObject(objectId: string): Promise<Pipeline[]> {
    return this.prisma.pipeline.findMany({
      where: { objectId, isArchived: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<Pipeline> {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id } });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${id}" not found`);
    }

    return pipeline;
  }

  async getDefault(objectId: string): Promise<Pipeline | null> {
    return this.prisma.pipeline.findFirst({
      where: { objectId, isDefault: true, isArchived: false },
    });
  }

  async update(id: string, dto: UpdatePipelineDto): Promise<Pipeline> {
    const existing = await this.findOne(id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { objectId: existing.objectId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: Prisma.PipelineUpdateInput = {
      ...dto,
      stages: dto.stages as unknown as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.pipeline.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.pipeline.update({
      where: { id },
      data: { isArchived: true },
    });

    this.logger.log('Pipeline archived', { pipelineId: id });
  }

  async getStageStats(pipelineId: string): Promise<Array<{ stage: string; count: number; value: number }>> {
    const pipeline = await this.findOne(pipelineId);
    const stages = pipeline.stages as unknown as PipelineStage[];

    const records = await this.prisma.record.groupBy({
      by: ['stage'],
      where: {
        objectId: pipeline.objectId,
        isArchived: false,
        stage: { in: stages.map((s) => s.id) },
      },
      _count: { id: true },
    });

    return stages.map((stage) => {
      const stats = records.find((r) => r.stage === stage.id);
      return {
        stage: stage.id,
        count: stats?._count.id || 0,
        value: 0, // Would need to sum deal values from record data
      };
    });
  }

  async createDefaultPipelines(): Promise<void> {
    // Get deals object
    const dealsObject = await this.prisma.object.findUnique({
      where: { name: 'deals' },
    });

    if (!dealsObject) {
      return;
    }

    const existingPipeline = await this.prisma.pipeline.findFirst({
      where: { objectId: dealsObject.id },
    });

    if (existingPipeline) {
      return;
    }

    await this.create({
      name: 'Sales Pipeline',
      objectId: dealsObject.id,
      isDefault: true,
      stages: [
        { id: 'lead', name: 'Lead', color: '#6B7280', position: 0, probability: 10 },
        { id: 'qualified', name: 'Qualified', color: '#3B82F6', position: 1, probability: 25 },
        { id: 'proposal', name: 'Proposal', color: '#F59E0B', position: 2, probability: 50 },
        { id: 'negotiation', name: 'Negotiation', color: '#8B5CF6', position: 3, probability: 75 },
        { id: 'closed_won', name: 'Closed Won', color: '#10B981', position: 4, probability: 100 },
        { id: 'closed_lost', name: 'Closed Lost', color: '#EF4444', position: 5, probability: 0 },
      ],
    });
  }
}
