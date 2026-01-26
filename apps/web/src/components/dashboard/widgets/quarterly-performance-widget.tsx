'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface QuarterlyData {
  closed: number;
  open70: number;
  goal: number | null;
}

function PerformanceChart({ data }: { data: QuarterlyData }) {
  const { t } = useTranslation();
  const months = ['Feb', 'Mar', 'Apr'];
  const yLabels = ['500k', '400k', '300k', '200k', '100k', '0'];

  return (
    <div className="relative h-48">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-400">
        {yLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute left-12 right-4 top-0 bottom-8">
        {yLabels.map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-dashed border-gray-200"
            style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="absolute left-12 right-4 bottom-0 h-8 flex justify-around items-center text-xs text-gray-400">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      {/* Empty state message */}
      <div className="absolute left-12 right-4 top-1/3 text-center text-gray-500">
        <p className="text-sm">
          {t('dashboard.addOpportunities', "Add the opportunities you're working on, then come back here to view your performance.")}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute left-12 bottom-12 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
          <span className="text-gray-600">{t('dashboard.closed', 'Closed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span className="text-gray-600">{t('dashboard.goal', 'Goal')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
          <span className="text-gray-600">{t('dashboard.closedOpen70', 'Closed + Open (>70%)')}</span>
        </div>
      </div>
    </div>
  );
}

export function QuarterlyPerformanceWidget() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  const quarterlyData: QuarterlyData = {
    closed: stats?.deals?.value || 0,
    open70: 0,
    goal: null,
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="sf-card h-full p-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          {t('dashboard.quarterlyPerformance', 'Quarterly Performance')}
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{t('dashboard.asOfToday', 'As of Today')}</span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            onClick={handleRefresh}
            className={cn(
              'p-1 rounded-md text-gray-400 transition-all hover:bg-gray-100',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-6 px-4 py-2 border-b border-gray-100 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500 uppercase text-xs">{t('dashboard.closed', 'CLOSED')}</span>
          <span className="font-bold text-gray-900">
            ${quarterlyData.closed.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500 uppercase text-xs">{t('dashboard.open70', 'OPEN (>70%)')}</span>
          <span className="font-bold text-gray-900">
            ${quarterlyData.open70.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500 uppercase text-xs">{t('dashboard.goal', 'GOAL')}</span>
          <span className="font-bold text-gray-400">--</span>
          <button className="p-0.5 text-gray-400 hover:text-gray-600">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <PerformanceChart data={quarterlyData} />
      </div>
    </div>
  );
}
