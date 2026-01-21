import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplate, Prisma } from '../../../generated/prisma';

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  body: string;
  category?: string;
  isShared?: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  category?: string;
  isShared?: boolean;
}

export interface QueryEmailTemplatesDto {
  category?: string;
  search?: string;
  includeShared?: boolean;
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

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmailTemplateDto, userId: string): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        category: dto.category,
        isShared: dto.isShared || false,
        ownerId: userId,
      },
    });

    this.logger.log('Email template created', { templateId: template.id, userId });

    return template;
  }

  async findAll(query: QueryEmailTemplatesDto, userId: string): Promise<PaginatedResult<EmailTemplate>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailTemplateWhereInput = {
      OR: [
        { ownerId: userId },
        ...(query.includeShared !== false ? [{ isShared: true }] : []),
      ],
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      const searchCondition: Prisma.EmailTemplateWhereInput = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } },
        ],
      };
      where.AND = [searchCondition];
    }

    const [data, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailTemplate.count({ where }),
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

  async findOne(id: string, userId: string): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    // Check access: owner or shared
    if (template.ownerId !== userId && !template.isShared) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return template;
  }

  async update(id: string, dto: UpdateEmailTemplateDto, userId: string): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    // Only owner can update
    if (template.ownerId !== userId) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        category: dto.category,
        isShared: dto.isShared,
      },
    });

    this.logger.log('Email template updated', { templateId: id, userId });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    // Only owner can delete
    if (template.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.prisma.emailTemplate.delete({ where: { id } });

    this.logger.log('Email template deleted', { templateId: id, userId });
  }

  async duplicate(id: string, userId: string): Promise<EmailTemplate> {
    const original = await this.findOne(id, userId);

    const duplicate = await this.prisma.emailTemplate.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        body: original.body,
        category: original.category,
        isShared: false,
        ownerId: userId,
      },
    });

    this.logger.log('Email template duplicated', {
      originalId: id,
      newId: duplicate.id,
      userId,
    });

    return duplicate;
  }

  async getCategories(userId: string): Promise<string[]> {
    const templates = await this.prisma.emailTemplate.findMany({
      where: {
        OR: [{ ownerId: userId }, { isShared: true }],
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });

    return templates
      .map((t) => t.category)
      .filter((c): c is string => c !== null);
  }

  // Preview template with sample data
  renderPreview(body: string, data: Record<string, string>): string {
    let rendered = body;
    for (const [key, value] of Object.entries(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }
}
