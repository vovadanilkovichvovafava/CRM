import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto, UpdateFieldDto } from './dto';
import { Field, FieldType, Prisma, InputJsonValue } from '../../../generated/prisma';

@Injectable()
export class FieldsService {
  private readonly logger = new Logger(FieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new field for an object
   */
  async create(dto: CreateFieldDto): Promise<Field> {
    // Verify object exists
    const object = await this.prisma.object.findUnique({
      where: { id: dto.objectId },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${dto.objectId}" not found`);
    }

    // Check if field name already exists for this object
    const existing = await this.prisma.field.findUnique({
      where: {
        objectId_name: {
          objectId: dto.objectId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Field with name "${dto.name}" already exists for this object`,
      );
    }

    // Validate field config based on type
    this.validateFieldConfig(dto.type, dto.config || {});

    // Get max position
    const maxPosition = await this.prisma.field.aggregate({
      where: { objectId: dto.objectId },
      _max: { position: true },
    });

    const field = await this.prisma.field.create({
      data: {
        objectId: dto.objectId,
        name: dto.name,
        displayName: dto.displayName,
        type: dto.type,
        config: (dto.config || {}) as InputJsonValue,
        isRequired: dto.isRequired || false,
        isUnique: dto.isUnique || false,
        defaultValue: dto.defaultValue,
        position: (maxPosition._max.position || 0) + 1,
      },
    });

    // Update object schema
    await this.updateObjectSchema(dto.objectId);

    this.logger.log('Field created', {
      fieldId: field.id,
      objectId: dto.objectId,
      name: field.name,
    });

    return field;
  }

  /**
   * Get all fields for an object
   */
  async findByObject(objectId: string): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: { objectId },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get field by ID
   */
  async findOne(id: string): Promise<Field> {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    return field;
  }

  /**
   * Update field
   */
  async update(id: string, dto: UpdateFieldDto): Promise<Field> {
    const existing = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    if (existing.isSystem) {
      throw new BadRequestException('Cannot modify system fields');
    }

    // Validate config if provided
    if (dto.config) {
      this.validateFieldConfig(existing.type, dto.config);
    }

    const updateData: Prisma.FieldUpdateInput = {
      ...dto,
      config: dto.config as InputJsonValue | undefined,
    };

    const field = await this.prisma.field.update({
      where: { id },
      data: updateData,
    });

    // Update object schema
    await this.updateObjectSchema(existing.objectId);

    this.logger.log('Field updated', { fieldId: id });

    return field;
  }

  /**
   * Delete field
   */
  async remove(id: string): Promise<void> {
    const existing = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    if (existing.isSystem) {
      throw new BadRequestException('Cannot delete system fields');
    }

    await this.prisma.field.delete({
      where: { id },
    });

    // Update object schema
    await this.updateObjectSchema(existing.objectId);

    this.logger.log('Field deleted', { fieldId: id, objectId: existing.objectId });
  }

  /**
   * Reorder fields
   */
  async reorder(objectId: string, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.field.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    this.logger.log('Fields reordered', { objectId, count: orderedIds.length });
  }

  /**
   * Create default fields for system objects
   */
  async createSystemFields(objectId: string, objectName: string): Promise<void> {
    const fieldConfigs = this.getSystemFieldsConfig(objectName);

    for (let i = 0; i < fieldConfigs.length; i++) {
      const config = fieldConfigs[i];
      const existing = await this.prisma.field.findUnique({
        where: {
          objectId_name: {
            objectId,
            name: config.name,
          },
        },
      });

      if (!existing) {
        await this.prisma.field.create({
          data: {
            name: config.name,
            displayName: config.displayName,
            type: config.type,
            config: config.config as InputJsonValue,
            isRequired: config.isRequired,
            isUnique: config.isUnique,
            objectId,
            position: i,
            isSystem: true,
          },
        });
      }
    }

    await this.updateObjectSchema(objectId);
  }

  /**
   * Validate field configuration based on type
   */
  private validateFieldConfig(type: FieldType, config: Record<string, unknown>): void {
    switch (type) {
      case FieldType.SELECT:
      case FieldType.MULTI_SELECT:
        // Options should be an array
        if (config.options && !Array.isArray(config.options)) {
          throw new BadRequestException('Options must be an array');
        }
        break;

      case FieldType.RELATION:
        // Must have relatedObjectId
        if (!config.relatedObjectId) {
          throw new BadRequestException('Relation fields must specify relatedObjectId');
        }
        break;

      case FieldType.FORMULA:
        // Must have formula
        if (!config.formula) {
          throw new BadRequestException('Formula fields must specify formula');
        }
        break;
    }
  }

  /**
   * Update object schema JSON from fields
   */
  private async updateObjectSchema(objectId: string): Promise<void> {
    const fields = await this.prisma.field.findMany({
      where: { objectId },
      orderBy: { position: 'asc' },
    });

    const schema = fields.reduce(
      (acc, field) => {
        acc[field.name] = {
          type: field.type,
          displayName: field.displayName,
          required: field.isRequired,
          unique: field.isUnique,
          config: field.config,
        };
        return acc;
      },
      {} as Record<string, unknown>,
    );

    await this.prisma.object.update({
      where: { id: objectId },
      data: { schema: schema as InputJsonValue },
    });
  }

  /**
   * Get system fields configuration for each object type
   */
  private getSystemFieldsConfig(objectName: string): Array<{
    name: string;
    displayName: string;
    type: FieldType;
    config: Record<string, unknown>;
    isRequired: boolean;
    isUnique: boolean;
  }> {
    const commonFields = [
      {
        name: 'name',
        displayName: 'Name',
        type: FieldType.TEXT,
        config: { maxLength: 255 },
        isRequired: true,
        isUnique: false,
      },
    ];

    const fieldsByObject: Record<string, typeof commonFields> = {
      contacts: [
        ...commonFields,
        {
          name: 'email',
          displayName: 'Email',
          type: FieldType.EMAIL,
          config: {},
          isRequired: false,
          isUnique: true,
        },
        {
          name: 'phone',
          displayName: 'Phone',
          type: FieldType.PHONE,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'company',
          displayName: 'Company',
          type: FieldType.RELATION,
          config: { relatedObjectId: 'companies' },
          isRequired: false,
          isUnique: false,
        },
      ],
      companies: [
        ...commonFields,
        {
          name: 'website',
          displayName: 'Website',
          type: FieldType.URL,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'industry',
          displayName: 'Industry',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: 'technology', label: 'Technology' },
              { value: 'finance', label: 'Finance' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'retail', label: 'Retail' },
              { value: 'other', label: 'Other' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'size',
          displayName: 'Company Size',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: '1-10', label: '1-10' },
              { value: '11-50', label: '11-50' },
              { value: '51-200', label: '51-200' },
              { value: '201-500', label: '201-500' },
              { value: '500+', label: '500+' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
      ],
      deals: [
        ...commonFields,
        {
          name: 'value',
          displayName: 'Deal Value',
          type: FieldType.CURRENCY,
          config: { currency: 'USD' },
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'stage',
          displayName: 'Stage',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: 'lead', label: 'Lead', color: '#6B7280' },
              { value: 'qualified', label: 'Qualified', color: '#3B82F6' },
              { value: 'proposal', label: 'Proposal', color: '#F59E0B' },
              { value: 'negotiation', label: 'Negotiation', color: '#8B5CF6' },
              { value: 'closed_won', label: 'Closed Won', color: '#10B981' },
              { value: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
            ],
          },
          isRequired: true,
          isUnique: false,
        },
        {
          name: 'close_date',
          displayName: 'Expected Close Date',
          type: FieldType.DATE,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'probability',
          displayName: 'Probability',
          type: FieldType.PERCENT,
          config: { min: 0, max: 100 },
          isRequired: false,
          isUnique: false,
        },
      ],
      webmasters: [
        ...commonFields,
        {
          name: 'email',
          displayName: 'Email',
          type: FieldType.EMAIL,
          config: {},
          isRequired: true,
          isUnique: true,
        },
        {
          name: 'telegram',
          displayName: 'Telegram',
          type: FieldType.TEXT,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'traffic_sources',
          displayName: 'Traffic Sources',
          type: FieldType.MULTI_SELECT,
          config: {
            options: [
              { value: 'facebook', label: 'Facebook' },
              { value: 'google', label: 'Google' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'native', label: 'Native' },
              { value: 'push', label: 'Push' },
              { value: 'seo', label: 'SEO' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'verticals',
          displayName: 'Verticals',
          type: FieldType.MULTI_SELECT,
          config: {
            options: [
              { value: 'gambling', label: 'Gambling' },
              { value: 'betting', label: 'Betting' },
              { value: 'finance', label: 'Finance' },
              { value: 'nutra', label: 'Nutra' },
              { value: 'dating', label: 'Dating' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'geos',
          displayName: 'GEOs',
          type: FieldType.MULTI_SELECT,
          config: {
            options: [
              { value: 'RU', label: 'Russia' },
              { value: 'UA', label: 'Ukraine' },
              { value: 'KZ', label: 'Kazakhstan' },
              { value: 'BR', label: 'Brazil' },
              { value: 'IN', label: 'India' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'quality_tier',
          displayName: 'Quality Tier',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: 'gold', label: 'Gold', color: '#F59E0B' },
              { value: 'silver', label: 'Silver', color: '#9CA3AF' },
              { value: 'bronze', label: 'Bronze', color: '#B45309' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
      ],
      partners: [
        ...commonFields,
        {
          name: 'website',
          displayName: 'Website',
          type: FieldType.URL,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'type',
          displayName: 'Partner Type',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: 'direct', label: 'Direct Advertiser' },
              { value: 'network', label: 'Affiliate Network' },
              { value: 'agency', label: 'Agency' },
            ],
          },
          isRequired: true,
          isUnique: false,
        },
        {
          name: 'manager_contact',
          displayName: 'Manager Contact',
          type: FieldType.TEXT,
          config: {},
          isRequired: false,
          isUnique: false,
        },
        {
          name: 'payment_terms',
          displayName: 'Payment Terms',
          type: FieldType.SELECT,
          config: {
            options: [
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Bi-weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'net30', label: 'Net 30' },
            ],
          },
          isRequired: false,
          isUnique: false,
        },
      ],
    };

    return fieldsByObject[objectName] || commonFields;
  }
}
