'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DataPoint {
  date: string;
  count: number;
}

function MiniLineChart({ data, height = 120 }: { data: DataPoint[]; height?: number }) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const minCount = Math.min(...data.map(d => d.count));
  const range = maxCount - minCount || 1;

  // Create SVG path
  const width = 100; // percentage-based
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.count - minCount) / range) * 80 - 10; // 10% padding
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Create area path (filled)
  const areaD = `M 0,100 L ${points.join(' L ')} L 100,100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      {/* Grid lines */}
      <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.3" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.3" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.3" />

      {/* Area fill with gradient */}
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGradient)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Data points */}
      {data.length <= 15 && points.map((point, i) => {
        const [x, y] = point.split(',').map(Number);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="#3b82f6"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

export function RevenueTrendWidget() {
  const { t, i18n } = useTranslation();
  const isRussian = i18n.language === 'ru';

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => api.dashboard.getAnalytics(),
    staleTime: 60000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  const recordsOverTime = analytics?.recordsOverTime || [];
  const totalValue = analytics?.totalDealsValue || 0;
  const avgValue = analytics?.avgDealValue || 0;

  // Calculate trend (last 7 days vs previous 7 days)
  const recentSum = recordsOverTime.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const previousSum = recordsOverTime.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
  const trend = previousSum > 0 ? ((recentSum - previousSum) / previousSum) * 100 : 0;

  if (isLoading) {
    return (
      <div className="sf-card h-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="sf-card h-full p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-900">
          {isRussian ? 'Динамика активности' : 'Activity Trend'}
        </h2>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full',
          trend > 0 && 'text-green-700 bg-green-50',
          trend < 0 && 'text-red-700 bg-red-50',
          trend === 0 && 'text-gray-600 bg-gray-100'
        )}>
          {trend > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
          <span>{Math.abs(Math.round(trend))}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {isRussian ? 'Общая сумма' : 'Total Value'}
          </p>
          <p className="text-xl font-bold text-gray-900">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {isRussian ? 'Средняя сделка' : 'Avg Deal'}
          </p>
          <p className="text-xl font-bold text-gray-900">
            ${avgValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[100px]">
        {recordsOverTime.length > 0 ? (
          <MiniLineChart data={recordsOverTime} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-sm text-center">
              {isRussian
                ? 'Нет данных за последние 30 дней'
                : 'No data for the last 30 days'}
            </p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {recordsOverTime.length > 0 && (
        <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
          <span>
            {new Date(recordsOverTime[0]?.date).toLocaleDateString(isRussian ? 'ru' : 'en', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>
            {isRussian ? '30 дней' : '30 days'}
          </span>
          <span>
            {new Date(recordsOverTime[recordsOverTime.length - 1]?.date).toLocaleDateString(
              isRussian ? 'ru' : 'en',
              { month: 'short', day: 'numeric' }
            )}
          </span>
        </div>
      )}
    </div>
  );
}
