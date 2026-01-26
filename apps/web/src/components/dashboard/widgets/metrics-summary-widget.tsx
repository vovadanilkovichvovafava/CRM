'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function MetricsSummaryWidget() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="sf-card h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const metrics = [
    {
      label: t('dashboard.totalContacts', 'Total Contacts'),
      value: stats?.contacts?.total || 0,
      change: stats?.contacts?.change || 0,
      color: 'text-blue-600',
    },
    {
      label: t('dashboard.companies', 'Companies'),
      value: stats?.companies?.total || 0,
      change: stats?.companies?.change || 0,
      color: 'text-emerald-600',
    },
    {
      label: t('dashboard.openDeals', 'Open Deals'),
      value: `$${(stats?.deals?.value || 0).toLocaleString()}`,
      change: stats?.deals?.change || 0,
      color: 'text-amber-600',
    },
    {
      label: t('dashboard.tasksDue', 'Tasks Due'),
      value: stats?.tasks?.due || 0,
      change: stats?.tasks?.completed || 0,
      changeLabel: t('common.completed', 'completed'),
      color: 'text-violet-600',
    },
  ];

  return (
    <div className="sf-card h-full p-0">
      <div className="grid grid-cols-4 h-full divide-x divide-gray-100">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-4 flex flex-col justify-center">
            <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
            <div className="flex items-end justify-between">
              <p className={cn('text-2xl font-bold', metric.color)}>{metric.value}</p>
              <div className="flex items-center gap-1 text-xs">
                {metric.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metric.changeLabel || `${metric.change >= 0 ? '+' : ''}${metric.change}%`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
