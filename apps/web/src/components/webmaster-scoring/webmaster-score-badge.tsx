'use client';

import { cn } from '@/lib/utils';

interface WebmasterScoreBadgeProps {
  score?: number | null;
  grade?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🥇' },
  Silver: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30', icon: '🥈' },
  Bronze: { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-600/30', icon: '🥉' },
  Standard: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: '📊' },
};

const SIZE_CLASSES = {
  sm: { badge: 'text-xs px-2 py-0.5', icon: 'text-sm' },
  md: { badge: 'text-sm px-2.5 py-1', icon: 'text-base' },
  lg: { badge: 'text-base px-3 py-1.5', icon: 'text-lg' },
};

export function WebmasterScoreBadge({
  score,
  grade,
  size = 'md',
  showScore = false,
  className,
}: WebmasterScoreBadgeProps) {
  const displayGrade = grade || calculateGrade(score);

  if (!displayGrade) {
    return null;
  }

  const styles = GRADE_STYLES[displayGrade] || GRADE_STYLES.Standard;
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        styles.bg,
        styles.text,
        styles.border,
        sizeClasses.badge,
        className
      )}
      title={`Webmaster Grade: ${displayGrade}${score !== null && score !== undefined ? ` (${Math.round(score)} points)` : ''}`}
    >
      <span className={sizeClasses.icon}>{styles.icon}</span>
      <span>{displayGrade}</span>
      {showScore && score !== null && score !== undefined && (
        <span className="opacity-60">({Math.round(score)})</span>
      )}
    </div>
  );
}

function calculateGrade(score?: number | null): string | null {
  if (score === null || score === undefined) return null;
  if (score >= 80) return 'Gold';
  if (score >= 60) return 'Silver';
  if (score >= 40) return 'Bronze';
  return 'Standard';
}

// Score breakdown component
interface ScoreBreakdownProps {
  factors: {
    volume: { score: number; maxScore: number };
    quality: { score: number; maxScore: number };
    reliability: { score: number; maxScore: number };
    communication: { score: number; maxScore: number };
  };
  className?: string;
}

const CATEGORY_INFO: Record<string, { label: string; icon: string; weight: string }> = {
  quality: { label: 'Quality', icon: '⭐', weight: '35%' },
  volume: { label: 'Volume', icon: '📈', weight: '30%' },
  reliability: { label: 'Reliability', icon: '🔒', weight: '25%' },
  communication: { label: 'Communication', icon: '💬', weight: '10%' },
};

export function WebmasterScoreBreakdown({ factors, className }: ScoreBreakdownProps) {
  const categories = ['quality', 'volume', 'reliability', 'communication'] as const;

  return (
    <div className={cn('space-y-3', className)}>
      {categories.map((key) => {
        const category = factors[key];
        const info = CATEGORY_INFO[key];
        const percentage = category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{info.icon}</span>
                <span className="text-white">{info.label}</span>
                <span className="text-white/40">({info.weight})</span>
              </div>
              <span className="text-white/60">
                {Math.round(category.score)}/{category.maxScore}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  percentage >= 80 ? 'bg-yellow-500' :
                  percentage >= 60 ? 'bg-slate-400' :
                  percentage >= 40 ? 'bg-orange-500' : 'bg-gray-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Distribution chart
interface DistributionChartProps {
  distribution: Record<string, number>;
  className?: string;
}

export function WebmasterDistribution({ distribution, className }: DistributionChartProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const grades = ['Gold', 'Silver', 'Bronze', 'Standard'];

  return (
    <div className={cn('space-y-2', className)}>
      {grades.map((grade) => {
        const count = distribution[grade] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const styles = GRADE_STYLES[grade];

        return (
          <div key={grade} className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-1.5">
              <span>{styles.icon}</span>
              <span className={cn('text-sm', styles.text)}>{grade}</span>
            </div>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn('h-full rounded-full', styles.bg.replace('/20', '/60'))}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-16 text-right">
              <span className="text-sm text-white">{count}</span>
              <span className="text-xs text-white/40 ml-1">({Math.round(percentage)}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
