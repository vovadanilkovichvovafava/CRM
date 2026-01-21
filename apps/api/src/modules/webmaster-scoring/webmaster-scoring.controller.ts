import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
import { WebmasterScoringService, WEBMASTER_GRADES } from './webmaster-scoring.service';
import {
  WebmasterScoreResponse,
  RecalculateResponse,
  TopWebmasterResponse,
  GradeThresholdsResponse,
} from './dto/webmaster-scoring.dto';

@ApiTags('Webmaster Scoring')
@ApiBearerAuth()
@Controller('webmaster-scoring')
@UseGuards(AuthGuard)
export class WebmasterScoringController {
  constructor(private readonly webmasterScoringService: WebmasterScoringService) {}

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Get webmaster score for a specific record' })
  @ApiParam({ name: 'recordId', description: 'Webmaster Record ID' })
  @ApiResponse({ status: 200, description: 'Webmaster score retrieved' })
  @ApiResponse({ status: 404, description: 'Score not found' })
  async getScore(@Param('recordId') recordId: string): Promise<WebmasterScoreResponse | null> {
    const score = await this.webmasterScoringService.getScore(recordId);
    if (!score) {
      return null;
    }
    return {
      ...score,
      calculatedAt: score.calculatedAt.toISOString(),
    };
  }

  @Post('record/:recordId/calculate')
  @ApiOperation({ summary: 'Calculate or recalculate webmaster score' })
  @ApiParam({ name: 'recordId', description: 'Webmaster Record ID' })
  @ApiResponse({ status: 200, description: 'Webmaster score calculated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async calculateScore(@Param('recordId') recordId: string): Promise<WebmasterScoreResponse> {
    const score = await this.webmasterScoringService.calculateScore(recordId);
    return {
      ...score,
      calculatedAt: score.calculatedAt.toISOString(),
    };
  }

  @Post('object/:objectId/recalculate')
  @ApiOperation({ summary: 'Recalculate scores for all webmasters in an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID (webmasters)' })
  @ApiResponse({ status: 200, description: 'Scores recalculated' })
  async recalculateAllScores(
    @Param('objectId') objectId: string,
  ): Promise<RecalculateResponse> {
    return this.webmasterScoringService.recalculateAllScores(objectId);
  }

  @Get('object/:objectId/distribution')
  @ApiOperation({ summary: 'Get grade distribution for webmasters' })
  @ApiParam({ name: 'objectId', description: 'Object ID (webmasters)' })
  @ApiResponse({ status: 200, description: 'Grade distribution retrieved' })
  async getDistribution(
    @Param('objectId') objectId: string,
  ): Promise<Record<string, number>> {
    return this.webmasterScoringService.getGradeDistribution(objectId);
  }

  @Get('object/:objectId/top')
  @ApiOperation({ summary: 'Get top webmasters by score' })
  @ApiParam({ name: 'objectId', description: 'Object ID (webmasters)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  @ApiResponse({ status: 200, description: 'Top webmasters retrieved' })
  async getTopWebmasters(
    @Param('objectId') objectId: string,
    @Query('limit') limit?: string,
  ): Promise<TopWebmasterResponse[]> {
    return this.webmasterScoringService.getTopWebmasters(
      objectId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('object/:objectId/by-grade')
  @ApiOperation({ summary: 'Get webmasters by grade' })
  @ApiParam({ name: 'objectId', description: 'Object ID (webmasters)' })
  @ApiQuery({ name: 'grade', description: 'Grade (Gold, Silver, Bronze, Standard)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 50)' })
  @ApiResponse({ status: 200, description: 'Webmasters retrieved' })
  async getWebmastersByGrade(
    @Param('objectId') objectId: string,
    @Query('grade') grade: string,
    @Query('limit') limit?: string,
  ): Promise<Array<{ recordId: string; totalScore: number }>> {
    return this.webmasterScoringService.getWebmastersByGrade(
      objectId,
      grade,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('grades')
  @ApiOperation({ summary: 'Get grade thresholds and colors' })
  @ApiResponse({ status: 200, description: 'Grade thresholds retrieved' })
  getGradeThresholds(): GradeThresholdsResponse {
    return {
      Gold: WEBMASTER_GRADES.GOLD,
      Silver: WEBMASTER_GRADES.SILVER,
      Bronze: WEBMASTER_GRADES.BRONZE,
      Standard: WEBMASTER_GRADES.STANDARD,
    };
  }

  @Get('category-weights')
  @ApiOperation({ summary: 'Get scoring category weights' })
  @ApiResponse({ status: 200, description: 'Category weights retrieved' })
  getCategoryWeights(): Record<string, number> {
    return {
      quality: 0.35,
      volume: 0.30,
      reliability: 0.25,
      communication: 0.10,
    };
  }
}
