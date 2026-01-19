import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { View, ViewType, Prisma, InputJsonValue } from '../../../generated/prisma';

export interface CreateViewDto {
  objectId: string;
  name: string;
  type: ViewType;
  config?: ViewConfig;
  isDefault?: boolean;
  isShared?: boolean;
}

export interface UpdateViewDto {
  name?: string;
  config?: ViewConfig;
  isDefault?: boolean;
  isShared?: boolean;
  position?: number;
}

export interface ViewConfig {
  columns?: Array<{
    fieldId: string;
    width?: number;
    visible?: boolean;
  }>;
  filters?: Array<{
    fieldId: string;
    operator: string;
    value: unknown;
  }>;
  sorting?: Array<{
    fieldId: string;
    direction: 'asc' | 'desc';
  }>;
  groupBy?: string;
  boardConfig?: {
    columnField: string;
    cardFields: string[];
  };
}

@Injectable()
export class ViewsService {
  private readonly logger = new Logger(ViewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateViewDto, userId: string): Promise<View> {
    // Verify object exists
    const object = await this.prisma.object.findUnique({
      where: { id: dto.objectId },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${dto.objectId}" not found`);
    }

    // Get max position
    const maxPosition = await this.prisma.view.aggregate({
      where: { objectId: dto.objectId },
      _max: { position: true },
    });

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.view.updateMany({
        where: { objectId: dto.objectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const view = await this.prisma.view.create({
      data: {
        objectId: dto.objectId,
        name: dto.name,
        type: dto.type,
        config: (dto.config || {}) as InputJsonValue,
        isDefault: dto.isDefault || false,
        isShared: dto.isShared || false,
        ownerId: userId,
        position: (maxPosition._max.position || 0) + 1,
      },
    });

    this.logger.log('View created', { viewId: view.id, objectId: dto.objectId });

    return view;
  }

  async findByObject(objectId: string, userId: string): Promise<View[]> {
    return this.prisma.view.findMany({
      where: {
        objectId,
        OR: [{ ownerId: userId }, { isShared: true }],
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string): Promise<View> {
    const view = await this.prisma.view.findUnique({
      where: { id },
    });

    if (!view) {
      throw new NotFoundException(`View with ID "${id}" not found`);
    }

    return view;
  }

  async update(id: string, dto: UpdateViewDto): Promise<View> {
    const existing = await this.findOne(id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.view.updateMany({
        where: { objectId: existing.objectId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: Prisma.ViewUpdateInput = {
      ...dto,
      config: dto.config as InputJsonValue | undefined,
    };

    return this.prisma.view.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.view.delete({ where: { id } });
    this.logger.log('View deleted', { viewId: id });
  }

  async createDefaultViews(objectId: string, userId: string): Promise<void> {
    const views = [
      { name: 'All Records', type: ViewType.TABLE, isDefault: true },
      { name: 'Board View', type: ViewType.BOARD },
      { name: 'List View', type: ViewType.LIST },
    ];

    for (let i = 0; i < views.length; i++) {
      await this.prisma.view.create({
        data: {
          objectId,
          name: views[i].name,
          type: views[i].type,
          config: {} as InputJsonValue,
          isDefault: views[i].isDefault || false,
          isShared: true,
          ownerId: userId,
          position: i,
        },
      });
    }
  }
}
