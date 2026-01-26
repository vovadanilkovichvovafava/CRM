'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Loader2,
  Trash2,
  Calendar,
  DollarSign,
  Timer,
  TrendingUp,
  RefreshCw,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TimerWidget } from '@/components/time/timer-widget';

interface TimeEntry {
  id: string;
  userId: string;
  taskId: string | null;
  projectId: string | null;
  description: string | null;
  duration: number;
  startTime: string;
  endTime: string | null;
  isBillable: boolean;
  hourlyRate: string | null;
  task: { id: string; title: string } | null;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface MetricProps {
  label: string;
  value: number;
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

export default function TimeTrackingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(now);

    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        return {};
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Get time entries
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['time-entries', dateFilter],
    queryFn: () => api.timeEntries.list(getDateRange()),
  });

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['time-entries', 'stats', dateFilter],
    queryFn: () => api.timeEntries.getStats(getDateRange()),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.timeEntries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success(t('common.success'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const entries = data?.data || [];

  // Group entries by date
  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const date = formatDate(entry.startTime);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);
  }, [entries]);

  const filterLabels: Record<string, string> = {
    today: t('common.today'),
    week: t('calendar.week'),
    month: t('calendar.month'),
    all: t('common.all'),
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('timeTracking.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('timeTracking.title')}
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

      {/* Timer Widget */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <TimerWidget />
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            {(['today', 'week', 'month', 'all'] as const).map((filter) => (
              <Metric
                key={filter}
                label={filterLabels[filter]}
                value={filter === dateFilter ? entries.length : 0}
                isActive={dateFilter === filter}
                onClick={() => setDateFilter(filter)}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-white/60" />
              <span className="text-sm">{stats?.totalHours || 0}h {t('timeTracking.totalTime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-white/60" />
              <span className="text-sm">${stats?.billableAmount?.toFixed(0) || 0} {t('timeTracking.billable')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalHours || 0}h</p>
                  <p className="text-xs text-gray-500">{t('timeTracking.totalTime')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats?.billableAmount?.toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-gray-500">{t('timeTracking.billable')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.entriesCount || 0}</p>
                  <p className="text-xs text-gray-500">{t('timeTracking.entries')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMinutes(stats?.billableMinutes || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{t('timeTracking.billableTime')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {entries.length} {t('timeTracking.entries')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="sf-card flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
            <Clock className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noData')}</h3>
            <p className="text-gray-500">{t('timeTracking.startTimer')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">{date}</h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {formatMinutes(dayEntries.reduce((sum, e) => sum + e.duration, 0))}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {entry.description || entry.task?.title || t('timeTracking.noDescription')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(entry.startTime)}
                          {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {entry.isBillable && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {t('timeTracking.billable')}
                          </span>
                        )}
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {formatMinutes(entry.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
