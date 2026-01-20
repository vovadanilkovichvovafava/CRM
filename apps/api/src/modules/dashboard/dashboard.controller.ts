import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activities')
  @Public()
  @ApiOperation({ summary: 'Get recent activities' })
  getRecentActivities(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivities(limit ? Number(limit) : 10);
  }

  @Get('upcoming-tasks')
  @Public()
  @ApiOperation({ summary: 'Get upcoming tasks' })
  getUpcomingTasks(@Query('limit') limit?: number) {
    return this.dashboardService.getUpcomingTasks(limit ? Number(limit) : 5);
  }
}
