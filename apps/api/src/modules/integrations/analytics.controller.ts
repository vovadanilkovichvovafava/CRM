import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get overall analytics summary' })
  @ApiResponse({ status: 200, description: 'Returns analytics summary' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO)' })
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateRange = from && to
      ? { from: new Date(from), to: new Date(to) }
      : undefined;
    return this.analyticsService.getSummary(dateRange);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get daily trend data' })
  @ApiResponse({ status: 200, description: 'Returns trend data' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  getTrend(@Query('days') days?: string) {
    return this.analyticsService.getTrend(days ? parseInt(days) : 30);
  }

  @Get('top-campaigns')
  @ApiOperation({ summary: 'Get top campaigns by profit' })
  @ApiResponse({ status: 200, description: 'Returns top campaigns' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  getTopCampaigns(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCampaigns(limit ? parseInt(limit) : 10);
  }

  @Get('top-offers')
  @ApiOperation({ summary: 'Get top offers by conversions' })
  @ApiResponse({ status: 200, description: 'Returns top offers' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  getTopOffers(@Query('limit') limit?: string) {
    return this.analyticsService.getTopOffers(limit ? parseInt(limit) : 10);
  }

  @Get('top-sources')
  @ApiOperation({ summary: 'Get top traffic sources' })
  @ApiResponse({ status: 200, description: 'Returns top sources' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  getTopSources(@Query('limit') limit?: string) {
    return this.analyticsService.getTopSources(limit ? parseInt(limit) : 10);
  }

  @Get('geo')
  @ApiOperation({ summary: 'Get conversion distribution by country' })
  @ApiResponse({ status: 200, description: 'Returns geo distribution' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  getGeoDistribution(@Query('limit') limit?: string) {
    return this.analyticsService.getGeoDistribution(limit ? parseInt(limit) : 10);
  }

  @Get('status-distribution')
  @ApiOperation({ summary: 'Get conversion status distribution' })
  @ApiResponse({ status: 200, description: 'Returns status distribution' })
  getStatusDistribution() {
    return this.analyticsService.getStatusDistribution();
  }

  @Get('webmasters')
  @ApiOperation({ summary: 'Get webmaster performance stats' })
  @ApiResponse({ status: 200, description: 'Returns webmaster stats' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 20)' })
  getWebmasterStats(@Query('limit') limit?: string) {
    return this.analyticsService.getWebmasterStats(limit ? parseInt(limit) : 20);
  }

  @Get('hourly')
  @ApiOperation({ summary: 'Get hourly conversion distribution for today' })
  @ApiResponse({ status: 200, description: 'Returns hourly distribution' })
  getHourlyDistribution() {
    return this.analyticsService.getHourlyDistribution();
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two date ranges' })
  @ApiResponse({ status: 200, description: 'Returns comparison data' })
  @ApiQuery({ name: 'from1', required: true, description: 'Current range start' })
  @ApiQuery({ name: 'to1', required: true, description: 'Current range end' })
  @ApiQuery({ name: 'from2', required: true, description: 'Previous range start' })
  @ApiQuery({ name: 'to2', required: true, description: 'Previous range end' })
  compareRanges(
    @Query('from1') from1: string,
    @Query('to1') to1: string,
    @Query('from2') from2: string,
    @Query('to2') to2: string,
  ) {
    return this.analyticsService.compareRanges(
      { from: new Date(from1), to: new Date(to1) },
      { from: new Date(from2), to: new Date(to2) },
    );
  }
}
