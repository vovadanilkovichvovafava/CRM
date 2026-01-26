'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  suffix,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  suffix?: string;
}) {
  return (
    <Card className="bg-white/[0.02] border-white/[0.05]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">
              {value}
              {suffix && <span className="text-lg text-white/60">{suffix}</span>}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({
  data,
  maxValue,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">{item.name}</span>
            <span className="text-white font-medium">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const { t } = useTranslation();
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg = total / data.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-sm text-white/50">new records in 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{avg.toFixed(1)}</p>
          <p className="text-sm text-white/50">avg per day</p>
        </div>
      </div>
      <div className="h-24 flex items-end gap-0.5">
        {data.map((item, index) => (
          <div
            key={item.date}
            className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
              minHeight: item.count > 0 ? '4px' : '0px',
            }}
            title={`${item.date}: ${item.count} records`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/30">
        <span>30 days ago</span>
        <span>{t('common.today')}</span>
      </div>
    </div>
  );
}

function DealsPipelineChart({
  data,
}: {
  data: Array<{ stage: string; count: number; value: number }>;
}) {
  const totalDeals = data.reduce((sum, d) => sum + d.count, 0);

  const stageColors = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-red-500',
  ];

  return (
    <div className="space-y-4">
      {/* Funnel visualization */}
      <div className="space-y-2">
        {data.map((stage, index) => {
          const percentage = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
          return (
            <div key={stage.stage} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/50">{stage.count} deals</span>
                  <span className="text-white font-medium">{formatCurrency(stage.value)}</span>
                </div>
              </div>
              <div className="h-8 rounded-lg bg-white/5 overflow-hidden relative">
                <div
                  className={`h-full ${stageColors[index % stageColors.length]} transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
  const { t } = useTranslation();
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.dashboard.getAnalytics(),
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <BarChart3 className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/50">Failed to load analytics data</p>
      </div>
    );
  }

  const recordsChartData = analytics.recordsByObject.map((obj) => ({
    name: obj.name,
    value: obj.count,
    color: obj.color,
  }));

  const maxRecordCount = Math.max(...recordsChartData.map((d) => d.value), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('analytics.title')}</h1>
            <p className="text-sm text-white/50">{t('analytics.metrics')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Records"
          value={analytics.totalRecords}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Total Deals Value"
          value={formatCurrency(analytics.totalDealsValue)}
          icon={DollarSign}
          gradient="from-emerald-500 to-green-500"
        />
        <StatCard
          title="Conversion Rate"
          value={analytics.conversionRate}
          suffix="%"
          icon={Percent}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Avg Deal Value"
          value={formatCurrency(analytics.avgDealValue)}
          icon={TrendingUp}
          gradient="from-violet-500 to-purple-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Records by Type */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Records by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordsChartData.length > 0 ? (
              <SimpleBarChart data={recordsChartData} maxValue={maxRecordCount} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p>{t('common.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Records Over Time */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recordsOverTime.length > 0 ? (
              <MiniLineChart data={analytics.recordsOverTime} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                <p>{t('common.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals Pipeline */}
        <Card className="bg-white/[0.02] border-white/[0.05] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Deals Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.dealsByStage.length > 0 ? (
              <DealsPipelineChart data={analytics.dealsByStage} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <DollarSign className="h-8 w-8 mb-2 opacity-50" />
                <p>{t('deals.noDeals')}</p>
                <p className="text-sm mt-1">{t('deals.createFirstDeal')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
