import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Workflow, WorkflowTrigger, Prisma } from '../../../generated/prisma';

// Condition operators
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  logic?: 'AND' | 'OR';
}

// Action types
export type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_TELEGRAM'
  | 'CREATE_TASK'
  | 'CREATE_NOTIFICATION'
  | 'UPDATE_FIELD'
  | 'WEBHOOK'
  | 'DELAY';

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, unknown>;
  order: number;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  objectId: string;
  trigger: WorkflowTrigger;
  triggerConfig?: Record<string, unknown>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  trigger?: WorkflowTrigger;
  triggerConfig?: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  isActive?: boolean;
}

export interface QueryWorkflowsDto {
  objectId?: string;
  isActive?: boolean;
  search?: string;
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
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto, userId: string): Promise<Workflow> {
    // Verify object exists
    const object = await this.prisma.object.findUnique({
      where: { id: dto.objectId },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID "${dto.objectId}" not found`);
    }

    const workflow = await this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        objectId: dto.objectId,
        trigger: dto.trigger,
        conditions: dto.conditions as unknown as Prisma.InputJsonValue,
        actions: dto.actions as unknown as Prisma.InputJsonValue,
        isActive: dto.isActive ?? false,
        createdBy: userId,
      },
      include: {
        object: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    this.logger.log('Workflow created', {
      workflowId: workflow.id,
      name: workflow.name,
      objectId: workflow.objectId,
      trigger: workflow.trigger,
    });

    return workflow;
  }

  async findAll(query: QueryWorkflowsDto, userId: string): Promise<PaginatedResult<Workflow>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkflowWhereInput = {};

    if (query.objectId) {
      where.objectId = query.objectId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          object: {
            select: { id: true, name: true, displayName: true, icon: true },
          },
          _count: {
            select: { executions: true },
          },
        },
      }),
      this.prisma.workflow.count({ where }),
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

  async findOne(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        object: {
          select: { id: true, name: true, displayName: true, icon: true },
        },
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID "${id}" not found`);
    }

    return workflow;
  }

  async update(id: string, dto: UpdateWorkflowDto, userId: string): Promise<Workflow> {
    const existing = await this.prisma.workflow.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Workflow with ID "${id}" not found`);
    }

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger,
        conditions: dto.conditions ? (dto.conditions as unknown as Prisma.InputJsonValue) : undefined,
        actions: dto.actions ? (dto.actions as unknown as Prisma.InputJsonValue) : undefined,
        isActive: dto.isActive,
      },
      include: {
        object: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    this.logger.log('Workflow updated', { workflowId: id, userId });

    return workflow;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.workflow.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Workflow with ID "${id}" not found`);
    }

    await this.prisma.workflow.delete({ where: { id } });

    this.logger.log('Workflow deleted', { workflowId: id, userId });
  }

  async toggleActive(id: string, userId: string): Promise<Workflow> {
    const existing = await this.prisma.workflow.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Workflow with ID "${id}" not found`);
    }

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        object: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    this.logger.log('Workflow toggled', {
      workflowId: id,
      isActive: workflow.isActive,
    });

    return workflow;
  }

  async duplicate(id: string, userId: string): Promise<Workflow> {
    const original = await this.findOne(id, userId);

    const duplicate = await this.prisma.workflow.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        objectId: original.objectId,
        trigger: original.trigger,
        conditions: original.conditions as unknown as Prisma.InputJsonValue,
        actions: original.actions as unknown as Prisma.InputJsonValue,
        isActive: false,
        createdBy: userId,
      },
      include: {
        object: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    this.logger.log('Workflow duplicated', {
      originalId: id,
      newId: duplicate.id,
    });

    return duplicate;
  }

  // Get workflows for a specific object (used by engine)
  async getActiveWorkflowsForObject(
    objectId: string,
    trigger: WorkflowTrigger,
  ): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      where: {
        objectId,
        trigger,
        isActive: true,
      },
    });
  }

  // Get execution history
  async getExecutions(
    workflowId: string,
    options?: { page?: number; limit?: number },
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { executedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workflowExecution.count({ where: { workflowId } }),
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

  // Get available variables for a trigger type
  getAvailableVariables(trigger: WorkflowTrigger): Array<{
    name: string;
    description: string;
    example: string;
  }> {
    const commonVars = [
      { name: '{{record.id}}', description: 'Record ID', example: 'clx123...' },
      { name: '{{record.<field>}}', description: 'Any record field', example: '{{record.email}}' },
      { name: '{{record.owner_id}}', description: 'Record owner ID', example: 'user_123' },
      { name: '{{object.name}}', description: 'Object name', example: 'webmasters' },
      { name: '{{object.displayName}}', description: 'Object display name', example: 'Webmasters' },
      { name: '{{user.id}}', description: 'Current user ID', example: 'user_123' },
      { name: '{{user.email}}', description: 'Current user email', example: 'user@example.com' },
      { name: '{{user.name}}', description: 'Current user name', example: 'John Doe' },
      { name: '{{now}}', description: 'Current date/time', example: '2024-01-15T10:30:00Z' },
      { name: '{{now.date}}', description: 'Current date', example: '2024-01-15' },
      { name: '{{now.time}}', description: 'Current time', example: '10:30:00' },
    ];

    const triggerSpecificVars: Record<WorkflowTrigger, Array<{ name: string; description: string; example: string }>> = {
      RECORD_CREATED: [],
      RECORD_UPDATED: [
        { name: '{{changes}}', description: 'Changed fields object', example: '{"status": {"old": "new", "new": "active"}}' },
        { name: '{{changes.<field>.old}}', description: 'Old field value', example: '{{changes.status.old}}' },
        { name: '{{changes.<field>.new}}', description: 'New field value', example: '{{changes.status.new}}' },
      ],
      RECORD_DELETED: [],
      FIELD_CHANGED: [
        { name: '{{field.name}}', description: 'Changed field name', example: 'status' },
        { name: '{{field.old}}', description: 'Old value', example: 'pending' },
        { name: '{{field.new}}', description: 'New value', example: 'active' },
      ],
      STAGE_CHANGED: [
        { name: '{{stage.old}}', description: 'Previous stage', example: 'lead' },
        { name: '{{stage.new}}', description: 'New stage', example: 'qualified' },
      ],
      TIME_BASED: [
        { name: '{{schedule.time}}', description: 'Scheduled time', example: '09:00' },
        { name: '{{schedule.day}}', description: 'Day of week', example: 'Monday' },
      ],
    };

    return [...commonVars, ...triggerSpecificVars[trigger]];
  }

  // Get available actions
  getAvailableActions(): Array<{
    type: ActionType;
    name: string;
    description: string;
    configSchema: Record<string, unknown>;
  }> {
    return [
      {
        type: 'SEND_EMAIL',
        name: 'Send Email',
        description: 'Send an email using a template',
        configSchema: {
          templateId: { type: 'string', required: true, label: 'Email Template' },
          to: { type: 'string', required: true, label: 'Recipient', placeholder: '{{record.email}}' },
          cc: { type: 'string', required: false, label: 'CC' },
          data: { type: 'object', required: false, label: 'Template Variables' },
        },
      },
      {
        type: 'SEND_TELEGRAM',
        name: 'Send Telegram',
        description: 'Send a message to Telegram',
        configSchema: {
          chatId: { type: 'string', required: true, label: 'Chat/User ID', placeholder: '{{record.telegram_id}}' },
          message: { type: 'text', required: true, label: 'Message', placeholder: 'New record: {{record.name}}' },
          parseMode: { type: 'select', options: ['HTML', 'Markdown'], label: 'Parse Mode' },
        },
      },
      {
        type: 'CREATE_TASK',
        name: 'Create Task',
        description: 'Create a new task',
        configSchema: {
          title: { type: 'string', required: true, label: 'Task Title', placeholder: 'Follow up with {{record.name}}' },
          description: { type: 'text', required: false, label: 'Description' },
          assigneeId: { type: 'string', required: false, label: 'Assignee', placeholder: '{{record.owner_id}}' },
          priority: { type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], label: 'Priority' },
          dueInDays: { type: 'number', required: false, label: 'Due in (days)' },
        },
      },
      {
        type: 'CREATE_NOTIFICATION',
        name: 'Create Notification',
        description: 'Send an in-app notification',
        configSchema: {
          userId: { type: 'string', required: true, label: 'User ID', placeholder: '{{record.owner_id}}' },
          title: { type: 'string', required: true, label: 'Title' },
          message: { type: 'text', required: true, label: 'Message' },
          type: { type: 'select', options: ['info', 'success', 'warning', 'error'], label: 'Type' },
        },
      },
      {
        type: 'UPDATE_FIELD',
        name: 'Update Field',
        description: 'Update a field on the record',
        configSchema: {
          field: { type: 'string', required: true, label: 'Field Name' },
          value: { type: 'any', required: true, label: 'Value' },
        },
      },
      {
        type: 'WEBHOOK',
        name: 'Call Webhook',
        description: 'Send data to an external URL',
        configSchema: {
          url: { type: 'string', required: true, label: 'URL' },
          method: { type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH'], label: 'Method' },
          headers: { type: 'object', required: false, label: 'Headers' },
          body: { type: 'object', required: false, label: 'Body' },
        },
      },
      {
        type: 'DELAY',
        name: 'Delay',
        description: 'Wait before executing next action',
        configSchema: {
          duration: { type: 'number', required: true, label: 'Duration' },
          unit: { type: 'select', options: ['minutes', 'hours', 'days'], label: 'Unit' },
        },
      },
    ];
  }
}
