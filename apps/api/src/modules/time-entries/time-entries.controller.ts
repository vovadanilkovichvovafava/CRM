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
  TimeEntriesService,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
} from './time-entries.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('time-entries')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create time entry' })
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries' })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'recordId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('taskId') taskId?: string,
    @Query('projectId') projectId?: string,
    @Query('recordId') recordId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timeEntriesService.findAll(
      {
        taskId,
        projectId,
        recordId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user.id,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get time tracking stats' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getStats(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.getStats(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active timer' })
  getActiveTimer(@CurrentUser() user: AuthUser) {
    return this.timeEntriesService.getActiveTimer(user.id);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start timer' })
  startTimer(
    @Body() body: { taskId?: string; description?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.timeEntriesService.startTimer(user.id, body);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop timer' })
  stopTimer(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.stopTimer(id, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update time entry' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timeEntriesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time entry' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.remove(id, user.id);
  }
}
