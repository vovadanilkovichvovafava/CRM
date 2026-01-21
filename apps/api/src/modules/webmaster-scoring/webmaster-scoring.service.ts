import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma';

// Scoring categories for webmasters
export enum WebmasterScoreCategory {
  VOLUME = 'volume',
  QUALITY = 'quality',
  RELIABILITY = 'reliability',
  COMMUNICATION = 'communication',
}

// Grade thresholds and names
export const WEBMASTER_GRADES = {
  GOLD: { min: 80, label: 'Gold', color: '#FFD700' },
  SILVER: { min: 60, label: 'Silver', color: '#C0C0C0' },
  BRONZE: { min: 40, label: 'Bronze', color: '#CD7F32' },
  STANDARD: { min: 0, label: 'Standard', color: '#808080' },
};

export interface WebmasterScoreFactors {
  volume: {
    score: number;
    maxScore: number;
    metrics: {
      leadsPerDay: number;
      leadsTotal: number;
      activeDays: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  quality: {
    score: number;
    maxScore: number;
    metrics: {
      conversionRate: number;
      approveRate: number;
      rejectRate: number;
      holdRate: number;
      avgLeadValue: number;
    };
  };
  reliability: {
    score: number;
    maxScore: number;
    metrics: {
      uptime: number; // Days with traffic / Total days
      consistency: number; // Variance in daily leads
      lastActivityDays: number;
      fraudIncidents: number;
    };
  };
  communication: {
    score: number;
    maxScore: number;
    metrics: {
      responseTime: number; // Average hours to respond
      activityCount: number;
      lastContactDays: number;
      hasMessenger: boolean;
    };
  };
}

export interface WebmasterScoreResult {
  recordId: string;
  volumeScore: number;
  qualityScore: number;
  reliabilityScore: number;
  communicationScore: number;
  totalScore: number;
  grade: string;
  gradeColor: string;
  factors: WebmasterScoreFactors;
  calculatedAt: Date;
}

// Weights for each category (must sum to 1)
const CATEGORY_WEIGHTS = {
  [WebmasterScoreCategory.QUALITY]: 0.35, // Quality is most important
  [WebmasterScoreCategory.VOLUME]: 0.30,
  [WebmasterScoreCategory.RELIABILITY]: 0.25,
  [WebmasterScoreCategory.COMMUNICATION]: 0.10,
};

@Injectable()
export class WebmasterScoringService {
  private readonly logger = new Logger(WebmasterScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate webmaster score for a single record
   */
  async calculateScore(recordId: string): Promise<WebmasterScoreResult> {
    // Get webmaster record with related data
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 500,
        },
        object: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Webmaster record not found');
    }

    const data = record.data as Record<string, unknown>;

    // Calculate each category score
    const volumeResult = this.calculateVolumeScore(data, record);
    const qualityResult = this.calculateQualityScore(data);
    const reliabilityResult = this.calculateReliabilityScore(data, record);
    const communicationResult = this.calculateCommunicationScore(data, record);

    // Calculate weighted total score
    const totalScore =
      volumeResult.score * CATEGORY_WEIGHTS[WebmasterScoreCategory.VOLUME] +
      qualityResult.score * CATEGORY_WEIGHTS[WebmasterScoreCategory.QUALITY] +
      reliabilityResult.score * CATEGORY_WEIGHTS[WebmasterScoreCategory.RELIABILITY] +
      communicationResult.score * CATEGORY_WEIGHTS[WebmasterScoreCategory.COMMUNICATION];

    // Determine grade
    const { grade, color } = this.calculateGrade(totalScore);

    const factors: WebmasterScoreFactors = {
      volume: volumeResult,
      quality: qualityResult,
      reliability: reliabilityResult,
      communication: communicationResult,
    };

    // Save to database
    await this.saveWebmasterScore(recordId, {
      volumeScore: volumeResult.score,
      qualityScore: qualityResult.score,
      reliabilityScore: reliabilityResult.score,
      communicationScore: communicationResult.score,
      totalScore,
      grade,
      factors,
    });

    // Update record's score field
    await this.prisma.record.update({
      where: { id: recordId },
      data: { score: totalScore },
    });

    return {
      recordId,
      volumeScore: Math.round(volumeResult.score * 10) / 10,
      qualityScore: Math.round(qualityResult.score * 10) / 10,
      reliabilityScore: Math.round(reliabilityResult.score * 10) / 10,
      communicationScore: Math.round(communicationResult.score * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
      grade,
      gradeColor: color,
      factors,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate Volume Score (0-100)
   * Based on: leads per day, total leads, active days, trend
   */
  private calculateVolumeScore(
    data: Record<string, unknown>,
    record: { createdAt: Date },
  ): WebmasterScoreFactors['volume'] {
    const leadsTotal = Number(data.leads_total) || Number(data.total_leads) || 0;
    const leadsPerDay = Number(data.leads_per_day) || Number(data.daily_leads) || 0;

    // Calculate active days since creation
    const daysSinceCreation = Math.max(
      1,
      Math.floor((Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    );
    const activeDays = Number(data.active_days) || daysSinceCreation;

    // Determine trend
    const lastWeekLeads = Number(data.last_week_leads) || 0;
    const prevWeekLeads = Number(data.prev_week_leads) || 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (lastWeekLeads > prevWeekLeads * 1.1) trend = 'up';
    else if (lastWeekLeads < prevWeekLeads * 0.9) trend = 'down';

    // Calculate score components
    let score = 0;

    // Leads per day (0-40 points)
    // 0 leads = 0, 10 leads = 20, 50+ leads = 40
    score += Math.min(40, (leadsPerDay / 50) * 40);

    // Total leads (0-30 points)
    // 0 leads = 0, 1000 leads = 15, 10000+ leads = 30
    score += Math.min(30, (leadsTotal / 10000) * 30);

    // Active days / consistency (0-20 points)
    const activityRatio = activeDays / daysSinceCreation;
    score += activityRatio * 20;

    // Trend bonus (0-10 points)
    if (trend === 'up') score += 10;
    else if (trend === 'stable') score += 5;

    return {
      score: Math.min(100, score),
      maxScore: 100,
      metrics: {
        leadsPerDay,
        leadsTotal,
        activeDays,
        trend,
      },
    };
  }

  /**
   * Calculate Quality Score (0-100)
   * Based on: conversion rate, approve rate, reject rate, lead value
   */
  private calculateQualityScore(data: Record<string, unknown>): WebmasterScoreFactors['quality'] {
    const conversionRate = Number(data.conversion_rate) || Number(data.cr) || 0;
    const approveRate = Number(data.approve_rate) || Number(data.approval_rate) || 0;
    const rejectRate = Number(data.reject_rate) || Number(data.rejection_rate) || 0;
    const holdRate = Number(data.hold_rate) || 0;
    const avgLeadValue = Number(data.avg_lead_value) || Number(data.epc) || 0;

    let score = 0;

    // Conversion rate (0-30 points)
    // 0% = 0, 5% = 15, 15%+ = 30
    score += Math.min(30, (conversionRate / 15) * 30);

    // Approve rate (0-40 points) - most important
    // 0% = 0, 50% = 20, 90%+ = 40
    score += Math.min(40, (approveRate / 90) * 40);

    // Low reject rate bonus (0-15 points)
    // 50%+ reject = 0, 0% reject = 15
    const rejectPenalty = Math.max(0, 15 - (rejectRate / 50) * 15);
    score += rejectPenalty;

    // Lead value (0-15 points)
    // $0 = 0, $50+ = 15
    score += Math.min(15, (avgLeadValue / 50) * 15);

    return {
      score: Math.min(100, score),
      maxScore: 100,
      metrics: {
        conversionRate,
        approveRate,
        rejectRate,
        holdRate,
        avgLeadValue,
      },
    };
  }

  /**
   * Calculate Reliability Score (0-100)
   * Based on: uptime, consistency, recent activity, fraud incidents
   */
  private calculateReliabilityScore(
    data: Record<string, unknown>,
    record: { createdAt: Date; activities: Array<{ createdAt: Date }> },
  ): WebmasterScoreFactors['reliability'] {
    const fraudIncidents = Number(data.fraud_incidents) || Number(data.fraud_count) || 0;
    const uptime = Number(data.uptime) || 100;

    // Calculate last activity
    const lastActivity = record.activities[0]?.createdAt;
    const lastActivityDays = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Consistency (lower variance = better)
    const consistency = Number(data.consistency) || Number(data.stability) || 50;

    let score = 0;

    // Uptime (0-35 points)
    // 0% = 0, 100% = 35
    score += (uptime / 100) * 35;

    // Consistency (0-25 points)
    score += (consistency / 100) * 25;

    // Recent activity (0-25 points)
    // Activity today = 25, 7 days ago = 15, 30+ days = 0
    if (lastActivityDays <= 1) score += 25;
    else if (lastActivityDays <= 7) score += 20;
    else if (lastActivityDays <= 14) score += 15;
    else if (lastActivityDays <= 30) score += 5;

    // No fraud bonus (0-15 points)
    // 0 incidents = 15, 3+ incidents = 0
    const fraudPenalty = Math.max(0, 15 - fraudIncidents * 5);
    score += fraudPenalty;

    return {
      score: Math.min(100, score),
      maxScore: 100,
      metrics: {
        uptime,
        consistency,
        lastActivityDays,
        fraudIncidents,
      },
    };
  }

  /**
   * Calculate Communication Score (0-100)
   * Based on: response time, activity, contact info
   */
  private calculateCommunicationScore(
    data: Record<string, unknown>,
    record: { activities: Array<{ type: string; createdAt: Date }> },
  ): WebmasterScoreFactors['communication'] {
    const responseTime = Number(data.response_time) || Number(data.avg_response_hours) || 24;
    const hasMessenger =
      !!data.telegram || !!data.skype || !!data.whatsapp || !!data.messenger;

    // Count communication activities
    const activityCount = record.activities.filter(
      (a) => ['NOTE', 'CALL', 'EMAIL', 'MEETING'].includes(a.type),
    ).length;

    // Last contact
    const lastContact = record.activities.find((a) =>
      ['NOTE', 'CALL', 'EMAIL', 'MEETING'].includes(a.type),
    );
    const lastContactDays = lastContact
      ? Math.floor((Date.now() - new Date(lastContact.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let score = 0;

    // Response time (0-40 points)
    // < 1 hour = 40, < 4 hours = 30, < 24 hours = 20, > 24 hours = 10
    if (responseTime <= 1) score += 40;
    else if (responseTime <= 4) score += 30;
    else if (responseTime <= 24) score += 20;
    else score += 10;

    // Activity count (0-25 points)
    score += Math.min(25, activityCount * 2.5);

    // Recent contact (0-20 points)
    if (lastContactDays <= 7) score += 20;
    else if (lastContactDays <= 14) score += 15;
    else if (lastContactDays <= 30) score += 10;
    else if (lastContactDays <= 60) score += 5;

    // Has messenger (0-15 points)
    if (hasMessenger) score += 15;

    return {
      score: Math.min(100, score),
      maxScore: 100,
      metrics: {
        responseTime,
        activityCount,
        lastContactDays,
        hasMessenger,
      },
    };
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): { grade: string; color: string } {
    if (score >= WEBMASTER_GRADES.GOLD.min) {
      return { grade: WEBMASTER_GRADES.GOLD.label, color: WEBMASTER_GRADES.GOLD.color };
    }
    if (score >= WEBMASTER_GRADES.SILVER.min) {
      return { grade: WEBMASTER_GRADES.SILVER.label, color: WEBMASTER_GRADES.SILVER.color };
    }
    if (score >= WEBMASTER_GRADES.BRONZE.min) {
      return { grade: WEBMASTER_GRADES.BRONZE.label, color: WEBMASTER_GRADES.BRONZE.color };
    }
    return { grade: WEBMASTER_GRADES.STANDARD.label, color: WEBMASTER_GRADES.STANDARD.color };
  }

  /**
   * Save webmaster score to database
   */
  private async saveWebmasterScore(
    recordId: string,
    data: {
      volumeScore: number;
      qualityScore: number;
      reliabilityScore: number;
      communicationScore: number;
      totalScore: number;
      grade: string;
      factors: WebmasterScoreFactors;
    },
  ): Promise<void> {
    await this.prisma.webmasterScore.upsert({
      where: { recordId },
      create: {
        recordId,
        volumeScore: data.volumeScore,
        qualityScore: data.qualityScore,
        reliabilityScore: data.reliabilityScore,
        communicationScore: data.communicationScore,
        totalScore: data.totalScore,
        grade: data.grade,
        factors: data.factors as unknown as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
      update: {
        volumeScore: data.volumeScore,
        qualityScore: data.qualityScore,
        reliabilityScore: data.reliabilityScore,
        communicationScore: data.communicationScore,
        totalScore: data.totalScore,
        grade: data.grade,
        factors: data.factors as unknown as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
    });
  }

  /**
   * Get webmaster score for a record
   */
  async getScore(recordId: string): Promise<WebmasterScoreResult | null> {
    const score = await this.prisma.webmasterScore.findUnique({
      where: { recordId },
    });

    if (!score) {
      return null;
    }

    const { color } = this.calculateGrade(score.totalScore);

    return {
      recordId: score.recordId,
      volumeScore: score.volumeScore,
      qualityScore: score.qualityScore,
      reliabilityScore: score.reliabilityScore,
      communicationScore: score.communicationScore,
      totalScore: score.totalScore,
      grade: score.grade,
      gradeColor: color,
      factors: score.factors as unknown as WebmasterScoreFactors,
      calculatedAt: score.calculatedAt,
    };
  }

  /**
   * Recalculate scores for all webmasters
   */
  async recalculateAllScores(objectId: string): Promise<{ processed: number; errors: number }> {
    const records = await this.prisma.record.findMany({
      where: { objectId, isArchived: false },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const record of records) {
      try {
        await this.calculateScore(record.id);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to calculate score for webmaster ${record.id}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        errors++;
      }
    }

    this.logger.log(`Recalculated webmaster scores`, { processed, errors });
    return { processed, errors };
  }

  /**
   * Get grade distribution for an object
   */
  async getGradeDistribution(objectId: string): Promise<Record<string, number>> {
    const records = await this.prisma.record.findMany({
      where: { objectId, isArchived: false },
      select: { id: true },
    });

    const recordIds = records.map((r) => r.id);

    const scores = await this.prisma.webmasterScore.findMany({
      where: { recordId: { in: recordIds } },
      select: { grade: true },
    });

    const distribution: Record<string, number> = {
      Gold: 0,
      Silver: 0,
      Bronze: 0,
      Standard: 0,
    };

    for (const score of scores) {
      distribution[score.grade] = (distribution[score.grade] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get top webmasters by score
   */
  async getTopWebmasters(
    objectId: string,
    limit = 10,
  ): Promise<Array<{ recordId: string; totalScore: number; grade: string }>> {
    const records = await this.prisma.record.findMany({
      where: { objectId, isArchived: false },
      select: { id: true },
    });

    const recordIds = records.map((r) => r.id);

    const scores = await this.prisma.webmasterScore.findMany({
      where: { recordId: { in: recordIds } },
      orderBy: { totalScore: 'desc' },
      take: limit,
      select: {
        recordId: true,
        totalScore: true,
        grade: true,
      },
    });

    return scores;
  }

  /**
   * Get webmasters by grade
   */
  async getWebmastersByGrade(
    objectId: string,
    grade: string,
    limit = 50,
  ): Promise<Array<{ recordId: string; totalScore: number }>> {
    const records = await this.prisma.record.findMany({
      where: { objectId, isArchived: false },
      select: { id: true },
    });

    const recordIds = records.map((r) => r.id);

    const scores = await this.prisma.webmasterScore.findMany({
      where: {
        recordId: { in: recordIds },
        grade,
      },
      orderBy: { totalScore: 'desc' },
      take: limit,
      select: {
        recordId: true,
        totalScore: true,
      },
    });

    return scores;
  }
}
