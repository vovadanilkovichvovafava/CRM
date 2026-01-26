'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StageData {
  stage: string;
  count: number;
  value: number;
}

function FunnelBar({ stage, count, value, maxValue, index, total }: {
  stage: string;
  count: number;
  value: number;
  maxValue: number;
  index: number;
  total: number;
}) {
  const { i18n } = useTranslation();
  const isRussian = i18n.language === 'ru';

  // Calculate width based on value (minimum 20% for visibility)
  const widthPercent = maxValue > 0 ? Math.max(20, (value / maxValue) * 100) : 20;

  // Color gradient from blue to green
  const colors = [
    'bg-blue-500',
    'bg-blue-400',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-emerald-500',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-28 text-sm text-gray-600 truncate text-right" title={stage}>
        {stage}
      </div>
      <div className="flex-1 relative h-8">
        <div
          className={cn(
            'h-full rounded-r-md transition-all duration-500',
            colorClass
          )}
          style={{ width: `${widthPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center px-3">
          <span className="text-white text-sm font-medium drop-shadow">
            {count} {isRussian ? 'сделок' : 'deals'} • ${value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PipelineChartWidget() {
  const { t, i18n } = useTranslation();
  const isRussian = i18n.language === 'ru';

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => api.dashboard.getAnalytics(),
    staleTime: 60000,
  });

  const dealsByStage = analytics?.dealsByStage || [];
  const maxValue = Math.max(...dealsByStage.map(s => s.value), 1);
  const totalDeals = dealsByStage.reduce((sum, s) => sum + s.count, 0);
  const totalValue = dealsByStage.reduce((sum, s) => sum + s.value, 0);

  if (isLoading) {
    return (
      <div className="sf-card h-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sf-card h-full p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {isRussian ? 'Воронка продаж' : 'Sales Pipeline'}
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            {totalDeals} {isRussian ? 'сделок' : 'deals'}
          </span>
          <span className="font-semibold text-gray-900">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Pipeline Chart */}
      <div className="flex-1 overflow-auto">
        {dealsByStage.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                {isRussian
                  ? 'Нет данных для отображения. Создайте сделки для просмотра воронки.'
                  : 'No data to display. Create deals to see the pipeline.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {dealsByStage.map((stage, index) => (
              <FunnelBar
                key={stage.stage}
                stage={stage.stage}
                count={stage.count}
                value={stage.value}
                maxValue={maxValue}
                index={index}
                total={dealsByStage.length}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conversion info */}
      {analytics && analytics.conversionRate > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {isRussian ? 'Конверсия в выигрыш' : 'Win rate'}
            </span>
            <span className="font-semibold text-green-600">
              {analytics.conversionRate}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
