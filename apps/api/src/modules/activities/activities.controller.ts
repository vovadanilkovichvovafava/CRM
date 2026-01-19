import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService, CreateActivityDto, QueryActivitiesDto } from './activities.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create activity' })
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: AuthUser) {
    return this.activitiesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get activities' })
  findAll(@Query() query: QueryActivitiesDto) {
    return this.activitiesService.findAll(query);
  }

  @Get('record/:recordId/timeline')
  @ApiOperation({ summary: 'Get record timeline' })
  getTimeline(@Param('recordId') recordId: string, @Query('limit') limit?: number) {
    return this.activitiesService.getTimeline(recordId, limit);
  }
}
