'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Loader2, Users, Building2, DollarSign, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type MetricType = 'contacts-count' | 'companies-count' | 'deals-value' | 'tasks-due';

interface SingleMetricWidgetProps {
  metricType: MetricType;
}

const metricConfig: Record<MetricType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  labelKey: string;
  labelDefault: string;
}> = {
  'contacts-count': {
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    labelKey: 'dashboard.totalContacts',
    labelDefault: 'Total Contacts',
  },
  'companies-count': {
    icon: Building2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    labelKey: 'dashboard.companies',
    labelDefault: 'Companies',
  },
  'deals-value': {
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    labelKey: 'dashboard.openDeals',
    labelDefault: 'Open Deals',
  },
  'tasks-due': {
    icon: Clock,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    labelKey: 'dashboard.tasksDue',
    labelDefault: 'Tasks Due',
  },
};

export function SingleMetricWidget({ metricType }: SingleMetricWidgetProps) {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  const config = metricConfig[metricType];
  const Icon = config.icon;

  const getValue = (): string | number => {
    if (!stats) return '--';
    switch (metricType) {
      case 'contacts-count':
        return stats.contacts?.total || 0;
      case 'companies-count':
        return stats.companies?.total || 0;
      case 'deals-value':
        return `$${(stats.deals?.value || 0).toLocaleString()}`;
      case 'tasks-due':
        return stats.tasks?.due || 0;
      default:
        return '--';
    }
  };

  const getChange = (): number => {
    if (!stats) return 0;
    switch (metricType) {
      case 'contacts-count':
        return stats.contacts?.change || 0;
      case 'companies-count':
        return stats.companies?.change || 0;
      case 'deals-value':
        return stats.deals?.change || 0;
      case 'tasks-due':
        return stats.tasks?.completed || 0;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="sf-card h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const value = getValue();
  const change = getChange();

  return (
    <div className="sf-card h-full p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {metricType === 'tasks-due'
              ? `${change} ${t('common.completed', 'completed')}`
              : `${change >= 0 ? '+' : ''}${change}%`}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <p className={cn('text-2xl font-bold', config.color)}>{value}</p>
        <p className="text-sm text-gray-500">{t(config.labelKey, config.labelDefault)}</p>
      </div>
    </div>
  );
}
