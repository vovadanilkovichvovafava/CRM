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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TasksService, CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { TaskStatus } from '../../../generated/prisma';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of tasks' })
  findAll(@Query() query: QueryTasksDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (archive) task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  remove(@Param('id') id: string, @Query('hard') hard?: boolean) {
    return this.tasksService.remove(id, hard);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move task to new status/position' })
  move(
    @Param('id') id: string,
    @Body() body: { status: TaskStatus; position: number },
  ) {
    return this.tasksService.moveTask(id, body.status, body.position);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Add checklist item' })
  addChecklistItem(@Param('id') id: string, @Body() body: { title: string }) {
    return this.tasksService.addChecklistItem(id, body.title);
  }

  @Patch('checklist/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle checklist item' })
  toggleChecklistItem(@Param('itemId') itemId: string) {
    return this.tasksService.toggleChecklistItem(itemId);
  }

  @Delete('checklist/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist item' })
  deleteChecklistItem(@Param('itemId') itemId: string) {
    return this.tasksService.deleteChecklistItem(itemId);
  }

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Add task dependency' })
  addDependency(
    @Param('id') id: string,
    @Body() body: { dependsOnId: string; type?: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED' },
  ) {
    return this.tasksService.addDependency(id, body.dependsOnId, body.type);
  }

  @Delete(':id/dependencies/:dependsOnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove task dependency' })
  removeDependency(@Param('id') id: string, @Param('dependsOnId') dependsOnId: string) {
    return this.tasksService.removeDependency(id, dependsOnId);
  }

  @Get('calendar/events')
  @ApiOperation({ summary: 'Get tasks for calendar view' })
  @ApiResponse({ status: 200, description: 'Returns tasks with dates for calendar' })
  getCalendarEvents(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('projectId') projectId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.tasksService.getCalendarEvents(startDate, endDate, user?.id || '', projectId);
  }
}
