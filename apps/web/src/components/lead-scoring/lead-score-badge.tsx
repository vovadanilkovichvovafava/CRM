'use client';

import { cn } from '@/lib/utils';

interface LeadScoreBadgeProps {
  score?: number | null;
  grade?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  C: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  D: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  F: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const SIZE_CLASSES = {
  sm: 'h-5 w-5 text-xs',
  md: 'h-7 w-7 text-sm',
  lg: 'h-9 w-9 text-base',
};

export function LeadScoreBadge({
  score,
  grade,
  size = 'md',
  showScore = false,
  className,
}: LeadScoreBadgeProps) {
  // Calculate grade from score if not provided
  const displayGrade = grade || calculateGrade(score);

  if (!displayGrade) {
    return null;
  }

  const colors = GRADE_COLORS[displayGrade] || GRADE_COLORS.F;

  return (
    <div className={cn('flex items-center gap-1.5', className)} title={`Lead Score: ${displayGrade}${score !== null && score !== undefined ? ` (${Math.round(score)} points)` : ''}`}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full border font-bold',
          colors.bg,
          colors.text,
          colors.border,
          SIZE_CLASSES[size]
        )}
      >
        {displayGrade}
      </div>
      {showScore && score !== null && score !== undefined && (
        <span className={cn('text-white/60', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {Math.round(score)}
        </span>
      )}
    </div>
  );
}

function calculateGrade(score?: number | null): string | null {
  if (score === null || score === undefined) return null;
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

// Score distribution chart component
interface ScoreDistributionProps {
  distribution: Record<string, number>;
  className?: string;
}

export function ScoreDistribution({ distribution, className }: ScoreDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const grades = ['A', 'B', 'C', 'D', 'F'];

  return (
    <div className={cn('space-y-2', className)}>
      {grades.map((grade) => {
        const count = distribution[grade] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const colors = GRADE_COLORS[grade];

        return (
          <div key={grade} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                colors.bg,
                colors.text
              )}
            >
              {grade}
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', colors.bg.replace('/20', '/50'))}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="w-12 text-right text-sm text-white/60">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Score details panel
interface ScoreDetailsProps {
  factors: {
    demographic: CategoryScore;
    firmographic: CategoryScore;
    behavioral: CategoryScore;
    engagement: CategoryScore;
    bant: CategoryScore;
  };
  className?: string;
}

interface CategoryScore {
  score: number;
  maxScore: number;
  details: Array<{
    rule: string;
    field: string;
    matched: boolean;
    score: number;
    reason?: string;
  }>;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  demographic: { label: 'Demographic', icon: '👤' },
  firmographic: { label: 'Firmographic', icon: '🏢' },
  behavioral: { label: 'Behavioral', icon: '📊' },
  engagement: { label: 'Engagement', icon: '💬' },
  bant: { label: 'BANT', icon: '🎯' },
};

export function ScoreDetails({ factors, className }: ScoreDetailsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(factors).map(([key, category]) => {
        const { label, icon } = CATEGORY_LABELS[key] || { label: key, icon: '📋' };
        const percentage = category.maxScore > 0
          ? (category.score / category.maxScore) * 100
          : 0;

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="font-medium text-white">{label}</span>
              </div>
              <span className="text-sm text-white/60">
                {category.score}/{category.maxScore}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  percentage >= 80 ? 'bg-green-500' :
                  percentage >= 60 ? 'bg-blue-500' :
                  percentage >= 40 ? 'bg-yellow-500' :
                  percentage >= 20 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Details (expandable in future) */}
            <div className="space-y-1 pl-6">
              {category.details.map((detail, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between text-xs',
                    detail.matched ? 'text-green-400' : 'text-white/30'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {detail.matched ? '✓' : '○'}
                    {detail.rule}
                  </span>
                  <span>{detail.matched ? `+${detail.score}` : '0'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
