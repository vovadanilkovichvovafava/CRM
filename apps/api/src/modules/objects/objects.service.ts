import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjectDto, UpdateObjectDto, QueryObjectsDto } from './dto';
import { Object as CrmObject, ObjectType, Prisma, InputJsonValue } from '../../../generated/prisma';

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
export class ObjectsService {
  private readonly logger = new Logger(ObjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new custom object
   */
  async create(dto: CreateObjectDto): Promise<CrmObject> {
    // Check if name already exists
    const existing = await this.prisma.object.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Object with name "${dto.name}" already exists`);
    }

    // Get max position for ordering
    const maxPosition = await this.prisma.object.aggregate({
      _max: { position: true },
    });

    const object = await this.prisma.object.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        type: dto.type || ObjectType.CUSTOM,
        icon: dto.icon,
        color: dto.color,
        schema: {} as InputJsonValue,
        settings: (dto.settings || {}) as InputJsonValue,
        position: (maxPosition._max.position || 0) + 1,
      },
    });

    this.logger.log('Object created', { objectId: object.id, name: object.name });

    return object;
  }

  /**
   * Get all objects with pagination
   */
  async findAll(query: QueryObjectsDto): Promise<PaginatedResult<CrmObject>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ObjectWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.object.findMany({
        where,
        orderBy: { position: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              fields: true,
              records: true,
            },
          },
        },
      }),
      this.prisma.object.count({ where }),
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
   * Get object by ID with fields
   */
  async findOne(id: string): Promise<CrmObject & { fields: unknown[] }> {
    const object = await this.prisma.object.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    return object;
  }

  /**
   * Get object by name
   */
  async findByName(name: string): Promise<CrmObject | null> {
    return this.prisma.object.findUnique({
      where: { name },
      include: {
        fields: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Update object
   */
  async update(id: string, dto: UpdateObjectDto): Promise<CrmObject> {
    const existing = await this.prisma.object.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    // Prevent modifying system objects (except certain fields)
    if (existing.type === ObjectType.SYSTEM) {
      const allowedFields = ['displayName', 'icon', 'color', 'settings', 'position'];
      const attemptedFields = Object.keys(dto);
      const disallowedFields = attemptedFields.filter((f) => !allowedFields.includes(f));

      if (disallowedFields.length > 0) {
        throw new BadRequestException(
          `Cannot modify fields [${disallowedFields.join(', ')}] on system objects`,
        );
      }
    }

    const updateData: Prisma.ObjectUpdateInput = {
      ...dto,
      settings: dto.settings as InputJsonValue | undefined,
    };

    const object = await this.prisma.object.update({
      where: { id },
      data: updateData,
    });

    this.logger.log('Object updated', { objectId: id });

    return object;
  }

  /**
   * Delete object (soft delete by archiving, or hard delete)
   */
  async remove(id: string, hard = false): Promise<void> {
    const existing = await this.prisma.object.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    if (existing.type === ObjectType.SYSTEM) {
      throw new BadRequestException('Cannot delete system objects');
    }

    if (hard) {
      // Hard delete - cascades to all related records, fields, etc.
      await this.prisma.object.delete({
        where: { id },
      });
      this.logger.log('Object hard deleted', { objectId: id });
    } else {
      // Soft delete - just archive
      await this.prisma.object.update({
        where: { id },
        data: { isArchived: true },
      });
      this.logger.log('Object archived', { objectId: id });
    }
  }

  /**
   * Reorder objects
   */
  async reorder(orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.object.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    this.logger.log('Objects reordered', { count: orderedIds.length });
  }

  /**
   * Create default system objects (Contacts, Companies, Deals)
   */
  async createSystemObjects(): Promise<void> {
    const systemObjects = [
      {
        name: 'contacts',
        displayName: 'Contacts',
        icon: '👤',
        color: '#3B82F6',
        position: 0,
      },
      {
        name: 'companies',
        displayName: 'Companies',
        icon: '🏢',
        color: '#10B981',
        position: 1,
      },
      {
        name: 'deals',
        displayName: 'Deals',
        icon: '💰',
        color: '#F59E0B',
        position: 2,
      },
      {
        name: 'webmasters',
        displayName: 'Webmasters',
        icon: '🌐',
        color: '#8B5CF6',
        position: 3,
      },
      {
        name: 'partners',
        displayName: 'Partners',
        icon: '🤝',
        color: '#EC4899',
        position: 4,
      },
    ];

    for (const obj of systemObjects) {
      const existing = await this.prisma.object.findUnique({
        where: { name: obj.name },
      });

      if (!existing) {
        await this.prisma.object.create({
          data: {
            ...obj,
            type: ObjectType.SYSTEM,
            schema: {} as InputJsonValue,
            settings: {} as InputJsonValue,
          },
        });
        this.logger.log('System object created', { name: obj.name });
      }
    }
  }
}
