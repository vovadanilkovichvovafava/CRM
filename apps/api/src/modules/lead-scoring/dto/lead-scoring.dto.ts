import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ScoreCategoryEnum {
  DEMOGRAPHIC = 'demographic',
  FIRMOGRAPHIC = 'firmographic',
  BEHAVIORAL = 'behavioral',
  ENGAGEMENT = 'engagement',
  BANT = 'bant',
}

export class ScoringRuleDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ScoreCategoryEnum })
  @IsEnum(ScoreCategoryEnum)
  category!: ScoreCategoryEnum;

  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty({ enum: ['equals', 'contains', 'greater_than', 'less_than', 'exists', 'in'] })
  @IsString()
  operator!: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'in';

  @ApiProperty()
  value!: string | number | string[];

  @ApiProperty()
  @IsNumber()
  score!: number;

  @ApiProperty()
  @IsNumber()
  maxScore!: number;
}

export class UpdateScoringRulesDto {
  @ApiProperty({ type: [ScoringRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoringRuleDto)
  rules!: ScoringRuleDto[];
}

export class RecalculateScoresDto {
  @ApiProperty({ description: 'Object ID to recalculate scores for' })
  @IsString()
  objectId!: string;
}

export class GetLeadsByGradeDto {
  @ApiProperty({ description: 'Object ID' })
  @IsString()
  objectId!: string;

  @ApiProperty({ description: 'Grade (A, B, C, D, F)' })
  @IsString()
  grade!: string;

  @ApiPropertyOptional({ description: 'Maximum number of results' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

// Response interfaces
export interface ScoreDetailResponse {
  rule: string;
  field: string;
  matched: boolean;
  score: number;
  reason?: string;
}

export interface CategoryScoreResponse {
  score: number;
  maxScore: number;
  details: ScoreDetailResponse[];
}

export interface LeadScoreResponse {
  recordId: string;
  totalScore: number;
  grade: string;
  factors: {
    demographic: CategoryScoreResponse;
    firmographic: CategoryScoreResponse;
    behavioral: CategoryScoreResponse;
    engagement: CategoryScoreResponse;
    bant: CategoryScoreResponse;
  };
  calculatedAt: string;
}

export interface ScoreDistributionResponse {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface RecalculateResultResponse {
  processed: number;
  errors: number;
}
