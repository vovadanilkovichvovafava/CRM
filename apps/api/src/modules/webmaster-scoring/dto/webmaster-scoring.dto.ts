import { ApiProperty } from '@nestjs/swagger';

export interface VolumeMetrics {
  leadsPerDay: number;
  leadsTotal: number;
  activeDays: number;
  trend: 'up' | 'down' | 'stable';
}

export interface QualityMetrics {
  conversionRate: number;
  approveRate: number;
  rejectRate: number;
  holdRate: number;
  avgLeadValue: number;
}

export interface ReliabilityMetrics {
  uptime: number;
  consistency: number;
  lastActivityDays: number;
  fraudIncidents: number;
}

export interface CommunicationMetrics {
  responseTime: number;
  activityCount: number;
  lastContactDays: number;
  hasMessenger: boolean;
}

export interface CategoryScore<T> {
  score: number;
  maxScore: number;
  metrics: T;
}

export interface WebmasterScoreFactorsDto {
  volume: CategoryScore<VolumeMetrics>;
  quality: CategoryScore<QualityMetrics>;
  reliability: CategoryScore<ReliabilityMetrics>;
  communication: CategoryScore<CommunicationMetrics>;
}

export interface WebmasterScoreResponse {
  recordId: string;
  volumeScore: number;
  qualityScore: number;
  reliabilityScore: number;
  communicationScore: number;
  totalScore: number;
  grade: string;
  gradeColor: string;
  factors: WebmasterScoreFactorsDto;
  calculatedAt: string;
}

export interface GradeDistributionResponse {
  Gold: number;
  Silver: number;
  Bronze: number;
  Standard: number;
}

export interface RecalculateResponse {
  processed: number;
  errors: number;
}

export interface TopWebmasterResponse {
  recordId: string;
  totalScore: number;
  grade: string;
}

export interface GradeThreshold {
  min: number;
  label: string;
  color: string;
}

export interface GradeThresholdsResponse {
  Gold: GradeThreshold;
  Silver: GradeThreshold;
  Bronze: GradeThreshold;
  Standard: GradeThreshold;
}
