import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma';

// Scoring factor categories
export enum ScoreCategory {
  DEMOGRAPHIC = 'demographic',
  FIRMOGRAPHIC = 'firmographic',
  BEHAVIORAL = 'behavioral',
  ENGAGEMENT = 'engagement',
  BANT = 'bant',
}

// Grade thresholds
export const GRADE_THRESHOLDS = {
  A: 80,
  B: 60,
  C: 40,
  D: 20,
  F: 0,
};

// Default scoring rules
export interface ScoringRule {
  id: string;
  name: string;
  category: ScoreCategory;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'in';
  value: string | number | boolean | string[];
  score: number;
  maxScore: number;
}

export interface ScoreFactors {
  [ScoreCategory.DEMOGRAPHIC]: { score: number; maxScore: number; details: ScoreDetail[] };
  [ScoreCategory.FIRMOGRAPHIC]: { score: number; maxScore: number; details: ScoreDetail[] };
  [ScoreCategory.BEHAVIORAL]: { score: number; maxScore: number; details: ScoreDetail[] };
  [ScoreCategory.ENGAGEMENT]: { score: number; maxScore: number; details: ScoreDetail[] };
  [ScoreCategory.BANT]: { score: number; maxScore: number; details: ScoreDetail[] };
}

export interface ScoreDetail {
  rule: string;
  field: string;
  matched: boolean;
  score: number;
  reason?: string;
}

export interface LeadScoreResult {
  recordId: string;
  totalScore: number;
  grade: string;
  factors: ScoreFactors;
  calculatedAt: Date;
}

// Default scoring rules for contacts/leads
const DEFAULT_SCORING_RULES: ScoringRule[] = [
  // Demographic rules
  {
    id: 'job_title_executive',
    name: 'Executive Job Title',
    category: ScoreCategory.DEMOGRAPHIC,
    field: 'job_title',
    operator: 'contains',
    value: ['CEO', 'CTO', 'CFO', 'VP', 'Director', 'Head'],
    score: 15,
    maxScore: 15,
  },
  {
    id: 'job_title_manager',
    name: 'Manager Job Title',
    category: ScoreCategory.DEMOGRAPHIC,
    field: 'job_title',
    operator: 'contains',
    value: ['Manager', 'Lead', 'Senior'],
    score: 10,
    maxScore: 10,
  },
  {
    id: 'has_email',
    name: 'Has Email Address',
    category: ScoreCategory.DEMOGRAPHIC,
    field: 'email',
    operator: 'exists',
    value: true,
    score: 5,
    maxScore: 5,
  },
  {
    id: 'has_phone',
    name: 'Has Phone Number',
    category: ScoreCategory.DEMOGRAPHIC,
    field: 'phone',
    operator: 'exists',
    value: true,
    score: 5,
    maxScore: 5,
  },

  // Firmographic rules
  {
    id: 'company_size_enterprise',
    name: 'Enterprise Company (500+)',
    category: ScoreCategory.FIRMOGRAPHIC,
    field: 'company_size',
    operator: 'greater_than',
    value: 500,
    score: 15,
    maxScore: 15,
  },
  {
    id: 'company_size_mid',
    name: 'Mid-size Company (50-500)',
    category: ScoreCategory.FIRMOGRAPHIC,
    field: 'company_size',
    operator: 'greater_than',
    value: 50,
    score: 10,
    maxScore: 10,
  },
  {
    id: 'has_company',
    name: 'Has Company Association',
    category: ScoreCategory.FIRMOGRAPHIC,
    field: 'company',
    operator: 'exists',
    value: true,
    score: 5,
    maxScore: 5,
  },

  // Engagement rules (based on activities)
  {
    id: 'recent_activity',
    name: 'Recent Activity (7 days)',
    category: ScoreCategory.ENGAGEMENT,
    field: '_activities_recent',
    operator: 'greater_than',
    value: 0,
    score: 10,
    maxScore: 10,
  },
  {
    id: 'multiple_activities',
    name: 'Multiple Activities (3+)',
    category: ScoreCategory.ENGAGEMENT,
    field: '_activities_count',
    operator: 'greater_than',
    value: 3,
    score: 10,
    maxScore: 10,
  },
  {
    id: 'has_meetings',
    name: 'Has Scheduled Meetings',
    category: ScoreCategory.ENGAGEMENT,
    field: '_meetings_count',
    operator: 'greater_than',
    value: 0,
    score: 15,
    maxScore: 15,
  },

  // BANT rules
  {
    id: 'has_budget',
    name: 'Budget Confirmed',
    category: ScoreCategory.BANT,
    field: 'budget',
    operator: 'exists',
    value: true,
    score: 10,
    maxScore: 10,
  },
  {
    id: 'is_decision_maker',
    name: 'Is Decision Maker',
    category: ScoreCategory.BANT,
    field: 'is_decision_maker',
    operator: 'equals',
    value: true,
    score: 10,
    maxScore: 10,
  },
  {
    id: 'has_timeline',
    name: 'Has Timeline',
    category: ScoreCategory.BANT,
    field: 'timeline',
    operator: 'exists',
    value: true,
    score: 10,
    maxScore: 10,
  },
];

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);
  private scoringRules: ScoringRule[] = DEFAULT_SCORING_RULES;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate lead score for a single record
   */
  async calculateScore(recordId: string): Promise<LeadScoreResult> {
    // Get record with related data
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        tasks: true,
        object: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const data = record.data as Record<string, unknown>;

    // Calculate enriched data for scoring
    const enrichedData = this.enrichDataForScoring(data, record);

    // Initialize factors
    const factors: ScoreFactors = {
      [ScoreCategory.DEMOGRAPHIC]: { score: 0, maxScore: 0, details: [] },
      [ScoreCategory.FIRMOGRAPHIC]: { score: 0, maxScore: 0, details: [] },
      [ScoreCategory.BEHAVIORAL]: { score: 0, maxScore: 0, details: [] },
      [ScoreCategory.ENGAGEMENT]: { score: 0, maxScore: 0, details: [] },
      [ScoreCategory.BANT]: { score: 0, maxScore: 0, details: [] },
    };

    // Apply each rule
    for (const rule of this.scoringRules) {
      const result = this.evaluateRule(rule, enrichedData);
      const category = factors[rule.category];

      category.maxScore += rule.maxScore;
      if (result.matched) {
        category.score += result.score;
      }

      category.details.push({
        rule: rule.name,
        field: rule.field,
        matched: result.matched,
        score: result.matched ? result.score : 0,
        reason: result.reason,
      });
    }

    // Calculate total score (normalized to 0-100)
    const totalMaxScore = Object.values(factors).reduce((sum, f) => sum + f.maxScore, 0);
    const totalScore = Object.values(factors).reduce((sum, f) => sum + f.score, 0);
    const normalizedScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Determine grade
    const grade = this.calculateGrade(normalizedScore);

    // Save to database
    await this.saveLeadScore(recordId, normalizedScore, grade, factors);

    // Update record's score field
    await this.prisma.record.update({
      where: { id: recordId },
      data: { score: normalizedScore },
    });

    return {
      recordId,
      totalScore: Math.round(normalizedScore * 10) / 10,
      grade,
      factors,
      calculatedAt: new Date(),
    };
  }

  /**
   * Enrich data with calculated fields for scoring
   */
  private enrichDataForScoring(
    data: Record<string, unknown>,
    record: { activities: Array<{ type: string; createdAt: Date }>; tasks: unknown[] },
  ): Record<string, unknown> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate activity metrics
    const recentActivities = record.activities.filter(
      (a) => new Date(a.createdAt) > sevenDaysAgo,
    ).length;

    const meetingsCount = record.activities.filter(
      (a) => a.type === 'MEETING' || a.type === 'CALL',
    ).length;

    return {
      ...data,
      _activities_count: record.activities.length,
      _activities_recent: recentActivities,
      _meetings_count: meetingsCount,
      _tasks_count: record.tasks.length,
    };
  }

  /**
   * Evaluate a single scoring rule
   */
  private evaluateRule(
    rule: ScoringRule,
    data: Record<string, unknown>,
  ): { matched: boolean; score: number; reason?: string } {
    const fieldValue = data[rule.field];

    switch (rule.operator) {
      case 'exists':
        const exists = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
        return {
          matched: exists === rule.value,
          score: rule.score,
          reason: exists ? `${rule.field} is present` : `${rule.field} is missing`,
        };

      case 'equals':
        const equals = fieldValue === rule.value;
        return {
          matched: equals,
          score: rule.score,
          reason: equals ? `${rule.field} matches expected value` : `${rule.field} does not match`,
        };

      case 'contains':
        if (typeof fieldValue !== 'string') {
          return { matched: false, score: 0, reason: `${rule.field} is not a string` };
        }
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        const contains = values.some((v) =>
          fieldValue.toLowerCase().includes(String(v).toLowerCase()),
        );
        return {
          matched: contains,
          score: rule.score,
          reason: contains
            ? `${rule.field} contains target value`
            : `${rule.field} does not contain target`,
        };

      case 'greater_than':
        const numValue = Number(fieldValue);
        if (isNaN(numValue)) {
          return { matched: false, score: 0, reason: `${rule.field} is not a number` };
        }
        const greaterThan = numValue > Number(rule.value);
        return {
          matched: greaterThan,
          score: rule.score,
          reason: greaterThan
            ? `${rule.field} (${numValue}) > ${rule.value}`
            : `${rule.field} (${numValue}) <= ${rule.value}`,
        };

      case 'less_than':
        const numVal = Number(fieldValue);
        if (isNaN(numVal)) {
          return { matched: false, score: 0, reason: `${rule.field} is not a number` };
        }
        const lessThan = numVal < Number(rule.value);
        return {
          matched: lessThan,
          score: rule.score,
          reason: lessThan
            ? `${rule.field} (${numVal}) < ${rule.value}`
            : `${rule.field} (${numVal}) >= ${rule.value}`,
        };

      case 'in':
        const inValues = Array.isArray(rule.value) ? rule.value : [rule.value];
        const inArray = inValues.includes(fieldValue as string);
        return {
          matched: inArray,
          score: rule.score,
          reason: inArray
            ? `${rule.field} is in allowed values`
            : `${rule.field} is not in allowed values`,
        };

      default:
        return { matched: false, score: 0, reason: 'Unknown operator' };
    }
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): string {
    if (score >= GRADE_THRESHOLDS.A) return 'A';
    if (score >= GRADE_THRESHOLDS.B) return 'B';
    if (score >= GRADE_THRESHOLDS.C) return 'C';
    if (score >= GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  /**
   * Save lead score to database
   */
  private async saveLeadScore(
    recordId: string,
    totalScore: number,
    grade: string,
    factors: ScoreFactors,
  ): Promise<void> {
    await this.prisma.leadScore.upsert({
      where: { recordId },
      create: {
        recordId,
        totalScore,
        grade,
        factors: factors as unknown as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
      update: {
        totalScore,
        grade,
        factors: factors as unknown as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
    });
  }

  /**
   * Get lead score for a record
   */
  async getScore(recordId: string): Promise<LeadScoreResult | null> {
    const score = await this.prisma.leadScore.findUnique({
      where: { recordId },
    });

    if (!score) {
      return null;
    }

    return {
      recordId: score.recordId,
      totalScore: score.totalScore,
      grade: score.grade,
      factors: score.factors as unknown as ScoreFactors,
      calculatedAt: score.calculatedAt,
    };
  }

  /**
   * Recalculate scores for all records of an object
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
        this.logger.error(`Failed to calculate score for record ${record.id}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        errors++;
      }
    }

    this.logger.log(`Recalculated scores for object ${objectId}`, { processed, errors });

    return { processed, errors };
  }

  /**
   * Get scoring rules
   */
  getScoringRules(): ScoringRule[] {
    return this.scoringRules;
  }

  /**
   * Update scoring rules
   */
  updateScoringRules(rules: ScoringRule[]): void {
    this.scoringRules = rules;
    this.logger.log('Scoring rules updated', { ruleCount: rules.length });
  }

  /**
   * Get leads by grade
   */
  async getLeadsByGrade(
    objectId: string,
    grade: string,
    limit = 50,
  ): Promise<Array<{ recordId: string; totalScore: number; calculatedAt: Date }>> {
    const scores = await this.prisma.leadScore.findMany({
      where: {
        grade,
      },
      orderBy: { totalScore: 'desc' },
      take: limit,
    });

    // Filter by objectId through records
    const recordIds = scores.map((s) => s.recordId);
    const records = await this.prisma.record.findMany({
      where: {
        id: { in: recordIds },
        objectId,
        isArchived: false,
      },
      select: { id: true },
    });

    const validRecordIds = new Set(records.map((r) => r.id));

    return scores
      .filter((s) => validRecordIds.has(s.recordId))
      .map((s) => ({
        recordId: s.recordId,
        totalScore: s.totalScore,
        calculatedAt: s.calculatedAt,
      }));
  }

  /**
   * Get score distribution for an object
   */
  async getScoreDistribution(objectId: string): Promise<Record<string, number>> {
    const records = await this.prisma.record.findMany({
      where: { objectId, isArchived: false },
      select: { id: true },
    });

    const recordIds = records.map((r) => r.id);

    const scores = await this.prisma.leadScore.findMany({
      where: { recordId: { in: recordIds } },
      select: { grade: true },
    });

    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    for (const score of scores) {
      distribution[score.grade] = (distribution[score.grade] || 0) + 1;
    }

    return distribution;
  }
}
