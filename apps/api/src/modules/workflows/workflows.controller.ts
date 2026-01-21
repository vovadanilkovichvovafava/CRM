import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  WorkflowsService,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from './workflows.service';
import { WorkflowEngineService, TriggerContext } from './workflow-engine.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { WorkflowTrigger } from '../../../generated/prisma';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: AuthUser) {
    return this.workflowsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiQuery({ name: 'objectId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('objectId') objectId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workflowsService.findAll(
      {
        objectId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user.id,
    );
  }

  @Get('meta/triggers')
  @ApiOperation({ summary: 'Get available triggers' })
  getTriggers() {
    return [
      {
        value: 'RECORD_CREATED',
        label: 'Record Created',
        description: 'When a new record is created',
        icon: 'plus-circle',
      },
      {
        value: 'RECORD_UPDATED',
        label: 'Record Updated',
        description: 'When a record is updated',
        icon: 'edit',
      },
      {
        value: 'RECORD_DELETED',
        label: 'Record Deleted',
        description: 'When a record is deleted',
        icon: 'trash',
      },
      {
        value: 'FIELD_CHANGED',
        label: 'Field Changed',
        description: 'When a specific field changes value',
        icon: 'refresh-cw',
      },
      {
        value: 'STAGE_CHANGED',
        label: 'Stage Changed',
        description: 'When record moves to a different stage',
        icon: 'git-branch',
      },
      {
        value: 'TIME_BASED',
        label: 'Scheduled',
        description: 'Run on a schedule',
        icon: 'clock',
      },
    ];
  }

  @Get('meta/actions')
  @ApiOperation({ summary: 'Get available actions' })
  getActions() {
    return this.workflowsService.getAvailableActions();
  }

  @Get('meta/operators')
  @ApiOperation({ summary: 'Get condition operators' })
  getOperators() {
    return [
      { value: 'equals', label: 'Equals', types: ['string', 'number', 'boolean'] },
      { value: 'not_equals', label: 'Does not equal', types: ['string', 'number', 'boolean'] },
      { value: 'contains', label: 'Contains', types: ['string'] },
      { value: 'not_contains', label: 'Does not contain', types: ['string'] },
      { value: 'starts_with', label: 'Starts with', types: ['string'] },
      { value: 'ends_with', label: 'Ends with', types: ['string'] },
      { value: 'greater_than', label: 'Greater than', types: ['number'] },
      { value: 'less_than', label: 'Less than', types: ['number'] },
      { value: 'greater_or_equal', label: 'Greater or equal', types: ['number'] },
      { value: 'less_or_equal', label: 'Less or equal', types: ['number'] },
      { value: 'is_empty', label: 'Is empty', types: ['string', 'number'] },
      { value: 'is_not_empty', label: 'Is not empty', types: ['string', 'number'] },
      { value: 'in', label: 'Is one of', types: ['string', 'number'] },
      { value: 'not_in', label: 'Is not one of', types: ['string', 'number'] },
    ];
  }

  @Get('meta/variables/:trigger')
  @ApiOperation({ summary: 'Get available variables for trigger' })
  getVariables(@Param('trigger') trigger: WorkflowTrigger) {
    return this.workflowsService.getAvailableVariables(trigger);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflowsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workflow' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflowsService.remove(id, user.id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle workflow active state' })
  toggle(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflowsService.toggleActive(id, user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate workflow' })
  duplicate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflowsService.duplicate(id, user.id);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow execution history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getExecutions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workflowsService.getExecutions(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test workflow with sample data' })
  async testWorkflow(
    @Param('id') id: string,
    @Body() body: { recordId: string },
    @CurrentUser() user: AuthUser,
  ) {
    const workflow = await this.workflowsService.findOne(id, user.id);

    // Get record for testing
    const record = await this.workflowEngine['prisma'].record.findUnique({
      where: { id: body.recordId },
      include: {
        object: { select: { id: true, name: true, displayName: true } },
      },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    const context: TriggerContext = {
      trigger: workflow.trigger,
      record: record as TriggerContext['record'],
      object: record.object,
      user: { id: user.id, email: user.email, name: user.name },
    };

    return this.workflowEngine.executeWorkflow(workflow, context);
  }
}
