import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailSendingService } from '../email-templates/email-sending.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import {
  Workflow,
  WorkflowTrigger,
  WorkflowExecutionStatus,
  Record as PrismaRecord,
  Prisma,
} from '../../../generated/prisma';
import { WorkflowCondition, WorkflowAction, ConditionOperator } from './workflows.service';

export interface TriggerContext {
  trigger: WorkflowTrigger;
  record: PrismaRecord & { data: Record<string, unknown> };
  object: { id: string; name: string; displayName: string };
  user: { id: string; email: string; name: string | null };
  changes?: Record<string, { old: unknown; new: unknown }>;
  field?: { name: string; old: unknown; new: unknown };
  stage?: { old: string; new: string };
}

export interface ExecutionResult {
  workflowId: string;
  status: WorkflowExecutionStatus;
  actionsExecuted: number;
  results: Array<{
    actionId: string;
    actionType: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
  error?: string;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly telegramBotToken: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailSendingService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {
    this.telegramBotToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  /**
   * Execute all active workflows for a given trigger
   */
  async executeTrigger(context: TriggerContext): Promise<ExecutionResult[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        objectId: context.object.id,
        trigger: context.trigger,
        isActive: true,
      },
    });

    if (workflows.length === 0) {
      return [];
    }

    this.logger.log(`Found ${workflows.length} workflow(s) for trigger`, {
      trigger: context.trigger,
      objectId: context.object.id,
      recordId: context.record.id,
    });

    const results: ExecutionResult[] = [];

    for (const workflow of workflows) {
      const result = await this.executeWorkflow(workflow, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single workflow
   */
  async executeWorkflow(
    workflow: Workflow,
    context: TriggerContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const conditions = workflow.conditions as unknown as WorkflowCondition[];
    const actions = workflow.actions as unknown as WorkflowAction[];

    this.logger.log(`Executing workflow: ${workflow.name}`, {
      workflowId: workflow.id,
      recordId: context.record.id,
    });

    // Check conditions
    if (!this.evaluateConditions(conditions, context)) {
      this.logger.log(`Workflow conditions not met`, { workflowId: workflow.id });

      // Log skipped execution
      await this.prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          recordId: context.record.id,
          status: WorkflowExecutionStatus.SUCCESS,
          result: { skipped: true, reason: 'Conditions not met' },
        },
      });

      return {
        workflowId: workflow.id,
        status: WorkflowExecutionStatus.SUCCESS,
        actionsExecuted: 0,
        results: [],
      };
    }

    // Execute actions
    const actionResults: ExecutionResult['results'] = [];
    let hasErrors = false;

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action, context);
        actionResults.push({
          actionId: action.id,
          actionType: action.type,
          success: true,
          result,
        });
      } catch (error) {
        hasErrors = true;
        actionResults.push({
          actionId: action.id,
          actionType: action.type,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        this.logger.error(`Action failed: ${action.type}`, {
          workflowId: workflow.id,
          actionId: action.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const status = hasErrors
      ? actionResults.some((r) => r.success)
        ? WorkflowExecutionStatus.PARTIAL
        : WorkflowExecutionStatus.FAILED
      : WorkflowExecutionStatus.SUCCESS;

    // Log execution
    await this.prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        recordId: context.record.id,
        status,
        result: {
          duration: Date.now() - startTime,
          actionsExecuted: actionResults.length,
          results: actionResults.map((r) => ({
            actionId: r.actionId,
            actionType: r.actionType,
            success: r.success,
            result: r.result !== undefined ? String(r.result) : null,
            error: r.error || null,
          })),
        } as Prisma.InputJsonValue,
        error: hasErrors
          ? actionResults
              .filter((r) => !r.success)
              .map((r) => r.error)
              .join('; ')
          : null,
      },
    });

    this.logger.log(`Workflow execution completed`, {
      workflowId: workflow.id,
      status,
      duration: Date.now() - startTime,
    });

    return {
      workflowId: workflow.id,
      status,
      actionsExecuted: actionResults.length,
      results: actionResults,
    };
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    context: TriggerContext,
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    let result = true;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const fieldValue = this.getFieldValue(condition.field, context);
      const conditionResult = this.evaluateCondition(
        fieldValue,
        condition.operator,
        condition.value,
      );

      if (i === 0) {
        result = conditionResult;
      } else {
        if (condition.logic === 'OR') {
          result = result || conditionResult;
        } else {
          result = result && conditionResult;
        }
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: ConditionOperator,
    conditionValue: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'greater_or_equal':
        return Number(fieldValue) >= Number(conditionValue);
      case 'less_or_equal':
        return Number(fieldValue) <= Number(conditionValue);
      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(fieldPath: string, context: TriggerContext): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: WorkflowAction,
    context: TriggerContext,
  ): Promise<unknown> {
    const config = this.resolveVariables(action.config, context);

    switch (action.type) {
      case 'SEND_EMAIL':
        return this.executeSendEmail(config, context);
      case 'SEND_TELEGRAM':
        return this.executeSendTelegram(config);
      case 'CREATE_TASK':
        return this.executeCreateTask(config, context);
      case 'CREATE_NOTIFICATION':
        return this.executeCreateNotification(config);
      case 'UPDATE_FIELD':
        return this.executeUpdateField(config, context);
      case 'WEBHOOK':
        return this.executeWebhook(config);
      case 'DELAY':
        return this.executeDelay(config);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Resolve variables in config object
   */
  private resolveVariables(
    config: Record<string, unknown>,
    context: TriggerContext,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveStringVariables(value, context);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveVariables(
          value as Record<string, unknown>,
          context,
        );
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Resolve variables in a string
   */
  private resolveStringVariables(template: string, context: TriggerContext): string {
    const variableMap = this.buildVariableMap(context);

    return template.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const trimmedPath = varPath.trim();

      // Check direct mapping first
      if (variableMap[trimmedPath] !== undefined) {
        return String(variableMap[trimmedPath]);
      }

      // Try to resolve path
      const value = this.resolvePath(trimmedPath, context);
      if (value !== undefined) {
        return String(value);
      }

      // Return original if not found
      return match;
    });
  }

  /**
   * Build a flat variable map for common variables
   */
  private buildVariableMap(context: TriggerContext): Record<string, unknown> {
    const now = new Date();

    return {
      'record.id': context.record.id,
      'record.owner_id': context.record.ownerId,
      'record.created_at': context.record.createdAt,
      'record.updated_at': context.record.updatedAt,
      'object.id': context.object.id,
      'object.name': context.object.name,
      'object.displayName': context.object.displayName,
      'user.id': context.user.id,
      'user.email': context.user.email,
      'user.name': context.user.name || '',
      'trigger.type': context.trigger,
      now: now.toISOString(),
      'now.date': now.toISOString().split('T')[0],
      'now.time': now.toTimeString().split(' ')[0],
      // Spread record data fields
      ...Object.entries(context.record.data || {}).reduce(
        (acc, [key, value]) => {
          acc[`record.${key}`] = value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
      // Add changes if available
      ...(context.changes
        ? Object.entries(context.changes).reduce(
            (acc, [field, change]) => {
              acc[`changes.${field}.old`] = change.old;
              acc[`changes.${field}.new`] = change.new;
              return acc;
            },
            {} as Record<string, unknown>,
          )
        : {}),
      // Add field change info
      ...(context.field
        ? {
            'field.name': context.field.name,
            'field.old': context.field.old,
            'field.new': context.field.new,
          }
        : {}),
      // Add stage change info
      ...(context.stage
        ? {
            'stage.old': context.stage.old,
            'stage.new': context.stage.new,
          }
        : {}),
    };
  }

  /**
   * Resolve a dot-notation path
   */
  private resolvePath(path: string, context: TriggerContext): unknown {
    const parts = path.split('.');
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;

      if (typeof current === 'object') {
        // Special handling for record.data fields
        if (parts[0] === 'record' && parts.length > 1) {
          const fieldName = parts.slice(1).join('.');
          const recordData = (context.record as { data: Record<string, unknown> }).data;
          if (recordData && fieldName in recordData) {
            return recordData[fieldName];
          }
        }

        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Action executors

  private async executeSendEmail(
    config: Record<string, unknown>,
    context: TriggerContext,
  ): Promise<unknown> {
    const templateId = config.templateId as string;
    const to = config.to as string;
    const cc = config.cc as string | undefined;
    const data = (config.data as Record<string, string>) || {};

    // Get email from record if using variable
    const recipientEmail = to.includes('@') ? to : String(data[to] || to);

    return this.emailService.sendFromTemplate(
      templateId,
      [recipientEmail],
      data,
      context.user.id,
      {
        cc: cc ? [cc] : undefined,
        recordId: context.record.id,
      },
    );
  }

  private async executeSendTelegram(config: Record<string, unknown>): Promise<unknown> {
    const chatId = config.chatId as string;
    const message = config.message as string;
    const parseMode = (config.parseMode as string) || 'HTML';

    if (!this.telegramBotToken) {
      throw new Error('Telegram bot token not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  private async executeCreateTask(
    config: Record<string, unknown>,
    context: TriggerContext,
  ): Promise<unknown> {
    const dueInDays = config.dueInDays as number | undefined;
    let dueDate: Date | undefined;

    if (dueInDays) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);
    }

    return this.prisma.task.create({
      data: {
        title: config.title as string,
        description: config.description as string | undefined,
        assigneeId: config.assigneeId as string | undefined,
        priority: (config.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
        dueDate,
        recordId: context.record.id,
        createdBy: context.user.id,
      },
    });
  }

  private async executeCreateNotification(config: Record<string, unknown>): Promise<unknown> {
    return this.notificationsService.create({
      userId: config.userId as string,
      type: (config.type as string) || 'info',
      title: config.title as string,
      message: config.message as string,
    });
  }

  private async executeUpdateField(
    config: Record<string, unknown>,
    context: TriggerContext,
  ): Promise<unknown> {
    const field = config.field as string;
    const value = config.value;

    const currentData = context.record.data as Record<string, unknown>;

    return this.prisma.record.update({
      where: { id: context.record.id },
      data: {
        data: {
          ...currentData,
          [field]: value,
        } as Prisma.InputJsonValue,
        updatedBy: context.user.id,
      },
    });
  }

  private async executeWebhook(config: Record<string, unknown>): Promise<unknown> {
    const url = config.url as string;
    const method = (config.method as string) || 'POST';
    const headers = (config.headers as Record<string, string>) || {};
    const body = config.body;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      body: await response.json().catch(() => null),
    };
  }

  private async executeDelay(config: Record<string, unknown>): Promise<unknown> {
    const duration = config.duration as number;
    const unit = (config.unit as string) || 'minutes';

    let ms = duration;
    switch (unit) {
      case 'minutes':
        ms = duration * 60 * 1000;
        break;
      case 'hours':
        ms = duration * 60 * 60 * 1000;
        break;
      case 'days':
        ms = duration * 24 * 60 * 60 * 1000;
        break;
    }

    // For now, just log the delay (in production, this would be handled by a job queue)
    this.logger.log(`Delay action: ${duration} ${unit} (${ms}ms)`);

    // Note: In production, this should schedule continuation via BullMQ
    // For simplicity, we'll just return immediately
    return { delayed: true, duration, unit, ms };
  }
}
