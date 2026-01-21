import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { LeadScoringService, ScoringRule } from './lead-scoring.service';
import {
  UpdateScoringRulesDto,
  LeadScoreResponse,
  RecalculateResultResponse,
} from './dto/lead-scoring.dto';

@ApiTags('Lead Scoring')
@ApiBearerAuth()
@Controller('lead-scoring')
@UseGuards(AuthGuard)
export class LeadScoringController {
  constructor(private readonly leadScoringService: LeadScoringService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Get current scoring rules' })
  @ApiResponse({ status: 200, description: 'Scoring rules retrieved' })
  getRules(): ScoringRule[] {
    return this.leadScoringService.getScoringRules();
  }

  @Put('rules')
  @ApiOperation({ summary: 'Update scoring rules' })
  @ApiResponse({ status: 200, description: 'Scoring rules updated' })
  updateRules(@Body() dto: UpdateScoringRulesDto): { success: boolean; ruleCount: number } {
    // Convert DTO rules to service format
    this.leadScoringService.updateScoringRules(dto.rules as unknown as ScoringRule[]);
    return { success: true, ruleCount: dto.rules.length };
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Get lead score for a specific record' })
  @ApiParam({ name: 'recordId', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Lead score retrieved' })
  @ApiResponse({ status: 404, description: 'Score not found' })
  async getScore(@Param('recordId') recordId: string): Promise<LeadScoreResponse | null> {
    const score = await this.leadScoringService.getScore(recordId);
    if (!score) {
      return null;
    }
    return {
      ...score,
      calculatedAt: score.calculatedAt.toISOString(),
    };
  }

  @Post('record/:recordId/calculate')
  @ApiOperation({ summary: 'Calculate or recalculate lead score for a record' })
  @ApiParam({ name: 'recordId', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Lead score calculated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async calculateScore(@Param('recordId') recordId: string): Promise<LeadScoreResponse> {
    const score = await this.leadScoringService.calculateScore(recordId);
    return {
      ...score,
      calculatedAt: score.calculatedAt.toISOString(),
    };
  }

  @Post('object/:objectId/recalculate')
  @ApiOperation({ summary: 'Recalculate scores for all records in an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  @ApiResponse({ status: 200, description: 'Scores recalculated' })
  async recalculateAllScores(
    @Param('objectId') objectId: string,
  ): Promise<RecalculateResultResponse> {
    return this.leadScoringService.recalculateAllScores(objectId);
  }

  @Get('object/:objectId/distribution')
  @ApiOperation({ summary: 'Get score distribution for an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  @ApiResponse({ status: 200, description: 'Score distribution retrieved' })
  async getDistribution(
    @Param('objectId') objectId: string,
  ): Promise<Record<string, number>> {
    return this.leadScoringService.getScoreDistribution(objectId);
  }

  @Get('object/:objectId/leads')
  @ApiOperation({ summary: 'Get leads by grade for an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  @ApiQuery({ name: 'grade', description: 'Grade (A, B, C, D, F)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results' })
  @ApiResponse({ status: 200, description: 'Leads retrieved' })
  async getLeadsByGrade(
    @Param('objectId') objectId: string,
    @Query('grade') grade: string,
    @Query('limit') limit?: string,
  ): Promise<Array<{ recordId: string; totalScore: number; calculatedAt: string }>> {
    const leads = await this.leadScoringService.getLeadsByGrade(
      objectId,
      grade.toUpperCase(),
      limit ? parseInt(limit, 10) : 50,
    );
    return leads.map((l) => ({
      ...l,
      calculatedAt: l.calculatedAt.toISOString(),
    }));
  }

  @Get('grades')
  @ApiOperation({ summary: 'Get grade thresholds' })
  @ApiResponse({ status: 200, description: 'Grade thresholds retrieved' })
  getGradeThresholds(): Record<string, number> {
    return {
      A: 80,
      B: 60,
      C: 40,
      D: 20,
      F: 0,
    };
  }
}
