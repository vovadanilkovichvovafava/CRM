'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Loader2,
  ChevronDown,
  RefreshCw,
  Settings,
  Calendar,
  Building2,
  Target,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value}`;
}

interface MetricProps {
  label: string;
  value: number | string;
  isActive?: boolean;
  onClick?: () => void;
}

function Metric({ label, value, isActive, onClick }: MetricProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-md transition-all duration-200',
        isActive
          ? 'bg-[#0070d2] text-white'
          : 'text-white hover:bg-white/10'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap', isActive ? 'text-white/80' : 'text-white/60')}>
        {label}
      </span>
    </button>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 mt-1 text-xs', change >= 0 ? 'text-green-600' : 'text-red-600')}>
                <TrendingUp className={cn('h-3 w-3', change < 0 && 'rotate-180')} />
                <span>{change >= 0 ? '+' : ''}{change}% vs last month</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartSVG({
  data,
  maxValue,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  maxValue: number;
}) {
  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{item.name}</span>
              <span className="text-gray-900 font-semibold">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AreaChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const { t } = useTranslation();
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg = (total / data.length).toFixed(1);

  const width = 100;
  const height = 60;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.count / maxCount) * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">new records in 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-gray-900">{avg}</p>
          <p className="text-sm text-gray-500">avg per day</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0070d2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0070d2" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill="url(#areaGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#0070d2"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((d.count / maxCount) * (height - 2 * padding));
          return (
            <circle
              key={d.date}
              cx={x}
              cy={y}
              r="1.5"
              fill="#0070d2"
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          );
        })}
      </svg>

      <div className="flex justify-between text-xs text-gray-400">
        <span>30 days ago</span>
        <span>{t('common.today')}</span>
      </div>
    </div>
  );
}

function PipelineFunnel({
  data,
}: {
  data: Array<{ stage: string; count: number; value: number }>;
}) {
  const { t } = useTranslation();
  const totalDeals = data.reduce((sum, d) => sum + d.count, 0);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const stageColors = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-green-600',
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
          <p className="text-sm text-gray-500">{t('deals.totalDeals', 'Total Deals')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-gray-500">{t('deals.pipelineValue', 'Pipeline Value')}</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="space-y-3">
        {data.map((stage, index) => {
          const percentage = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
          const widthPercent = 100 - (index * 10);

          return (
            <div key={stage.stage} className="group">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-700 font-medium">{stage.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{stage.count} deals</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(stage.value)}</span>
                </div>
              </div>
              <div
                className="h-10 rounded-lg overflow-hidden relative mx-auto transition-all"
                style={{ width: `${widthPercent}%` }}
              >
                <div
                  className={cn(
                    'h-full transition-all duration-500 flex items-center justify-center',
                    stageColors[index % stageColors.length]
                  )}
                >
                  <span className="text-xs text-white font-medium">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const isRussian = i18n.language === 'ru';

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.dashboard.getAnalytics(),
    staleTime: 60000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const recordsChartData = useMemo(() => {
    if (!analytics?.recordsByObject) return [];
    return analytics.recordsByObject.map((obj) => ({
      name: obj.name,
      value: obj.count,
      color: obj.color,
    }));
  }, [analytics?.recordsByObject]);

  const maxRecordCount = useMemo(() => {
    return Math.max(...recordsChartData.map((d) => d.value), 1);
  }, [recordsChartData]);

  const periodLabels: Record<string, string> = {
    week: isRussian ? 'Неделя' : 'Week',
    month: isRussian ? 'Месяц' : 'Month',
    quarter: isRussian ? 'Квартал' : 'Quarter',
    year: isRussian ? 'Год' : 'Year',
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f4f6f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f4f6f9]">
        <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">{isRussian ? 'Не удалось загрузить данные' : 'Failed to load analytics data'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('analytics.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('analytics.title')}
                </h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
              <Metric
                key={p}
                label={periodLabels[p]}
                value=""
                isActive={period === p}
                onClick={() => setPeriod(p)}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <span className="text-sm">
                {new Date().toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={isRussian ? 'Всего записей' : 'Total Records'}
            value={analytics.totalRecords.toLocaleString()}
            change={12}
            icon={Users}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title={isRussian ? 'Сумма сделок' : 'Total Deals Value'}
            value={formatCurrency(analytics.totalDealsValue)}
            change={8}
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            title={isRussian ? 'Конверсия' : 'Conversion Rate'}
            value={`${analytics.conversionRate}%`}
            change={-2}
            icon={Percent}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title={isRussian ? 'Средняя сделка' : 'Avg Deal Value'}
            value={formatCurrency(analytics.avgDealValue)}
            change={15}
            icon={Target}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Records by Type */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {isRussian ? 'Записи по типу' : 'Records by Type'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {recordsChartData.length > 0 ? (
                <BarChartSVG data={recordsChartData} maxValue={maxRecordCount} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t('common.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Records Over Time */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                {isRussian ? 'Активность (30 дней)' : 'Activity (Last 30 Days)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {analytics.recordsOverTime.length > 0 ? (
                <AreaChart data={analytics.recordsOverTime} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t('common.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals Pipeline */}
          <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-500" />
                {isRussian ? 'Воронка сделок' : 'Deals Pipeline'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {analytics.dealsByStage.length > 0 ? (
                <PipelineFunnel data={analytics.dealsByStage} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <DollarSign className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t('deals.noDeals')}</p>
                  <p className="text-sm mt-1">{t('deals.createFirstDeal')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
