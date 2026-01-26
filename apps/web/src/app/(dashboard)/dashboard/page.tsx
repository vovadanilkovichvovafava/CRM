'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import {
  RefreshCw,
  ChevronDown,
  Plus,
  TrendingUp,
  TrendingDown,
  Info,
  Pencil,
  Loader2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuarterlyData {
  closed: number;
  open70: number;
  goal: number | null;
}

function EmptyStateIllustration({ variant = 'default' }: { variant?: 'default' | 'events' | 'tasks' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
      <svg
        viewBox="0 0 200 140"
        className="w-48 h-32 mb-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky */}
        <rect width="200" height="140" fill="#f0f7ff" rx="8" />

        {/* Clouds */}
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <ellipse cx="40" cy="30" rx="15" ry="8" fill="#d6e8f7" />
          <ellipse cx="50" cy="28" rx="12" ry="6" fill="#d6e8f7" />
          <ellipse cx="32" cy="32" rx="10" ry="5" fill="#d6e8f7" />
        </g>

        <g className="animate-float" style={{ animationDelay: '1s' }}>
          <ellipse cx="160" cy="40" rx="18" ry="9" fill="#d6e8f7" />
          <ellipse cx="175" cy="38" rx="14" ry="7" fill="#d6e8f7" />
          <ellipse cx="150" cy="42" rx="12" ry="6" fill="#d6e8f7" />
        </g>

        {/* Sun */}
        <circle cx="170" cy="25" r="12" fill="#ffd166" className="animate-pulse-soft" />

        {/* Mountains */}
        <path d="M0 140 L40 80 L80 140 Z" fill="#a8d5e5" />
        <path d="M60 140 L100 70 L140 140 Z" fill="#7ec8e3" />
        <path d="M120 140 L160 85 L200 140 Z" fill="#a8d5e5" />

        {/* Trees */}
        {variant === 'events' && (
          <>
            <rect x="85" y="100" width="4" height="20" fill="#8b6914" />
            <path d="M87 70 L97 100 L77 100 Z" fill="#52b788" />
            <path d="M87 80 L95 95 L79 95 Z" fill="#40916c" />
          </>
        )}

        {variant === 'tasks' && (
          <>
            <rect x="115" y="105" width="3" height="15" fill="#8b6914" />
            <path d="M116 85 L124 105 L108 105 Z" fill="#52b788" />

            <rect x="45" y="108" width="3" height="12" fill="#8b6914" />
            <path d="M46 92 L53 108 L39 108 Z" fill="#52b788" />
          </>
        )}

        {/* Ground */}
        <path d="M0 130 Q50 120 100 130 Q150 140 200 130 L200 140 L0 140 Z" fill="#c7f9cc" />

        {/* Birds */}
        <g className="animate-float" style={{ animationDelay: '0.5s' }}>
          <path d="M55 55 Q60 50 65 55" stroke="#0070d2" strokeWidth="1.5" fill="none" />
          <path d="M70 50 Q75 45 80 50" stroke="#0070d2" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </div>
  );
}

function PerformanceChart({ data }: { data: QuarterlyData }) {
  const { t } = useTranslation();
  const _maxValue = Math.max(data.closed, data.open70, data.goal || 0, 500000);

  const months = ['Feb', 'Mar', 'Apr'];
  const yLabels = ['500k', '400k', '300k', '200k', '100k', '0'];

  return (
    <div className="relative h-72">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
        {yLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute left-14 right-4 top-0 bottom-8">
        {yLabels.map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-dashed border-gray-200"
            style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="absolute left-14 right-4 bottom-0 h-8 flex justify-around items-center text-xs text-gray-400">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      {/* Empty state message */}
      <div className="absolute left-14 right-4 top-1/3 text-center text-gray-500">
        <p className="text-sm">
          {t('dashboard.addOpportunities', "Add the opportunities you're working on, then come back here to view your performance.")}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute left-14 bottom-12 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-gray-600">{t('dashboard.closed', 'Closed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-gray-600">{t('dashboard.goal', 'Goal')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span className="text-gray-600">{t('dashboard.closedOpen70', 'Closed + Open (>70%)')}</span>
        </div>
      </div>
    </div>
  );
}

function QuarterlyPerformanceWidget() {
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
    <div className="sf-card p-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.quarterlyPerformance', 'Quarterly Performance')}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{t('dashboard.asOfToday', 'As of Today')}</span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            onClick={handleRefresh}
            className={cn(
              'p-1.5 rounded-md text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-8 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.closed', 'CLOSED')}</span>
          <span className="text-lg font-bold text-gray-900">
            ${quarterlyData.closed.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.open70', 'OPEN (>70%)')}</span>
          <span className="text-lg font-bold text-gray-900">
            ${quarterlyData.open70.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.goal', 'GOAL')}</span>
          <span className="text-lg font-bold text-gray-400">--</span>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <PerformanceChart data={quarterlyData} />
      </div>
    </div>
  );
}

function AssistantWidget() {
  const { t } = useTranslation();

  return (
    <div className="sf-card p-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.assistant', 'Assistant')}
        </h2>
      </div>
      <div className="p-6">
        <EmptyStateIllustration variant="default" />
        <p className="text-center text-gray-500 text-sm">
          {t('dashboard.nothingNeedsAttention', 'Nothing needs your attention right now. Check back later.')}
        </p>
      </div>
    </div>
  );
}

function TodaysEventsWidget() {
  const { t } = useTranslation();

  const { data: events, isLoading } = useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => Promise.resolve([]),
    staleTime: 30000,
  });

  return (
    <div className="sf-card p-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.todaysEvents', "Today's Events")}
        </h2>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-3">
            {/* Events list */}
          </div>
        ) : (
          <EmptyStateIllustration variant="events" />
        )}
      </div>
    </div>
  );
}

interface UpcomingTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
}

function TodaysTasksWidget() {
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-tasks'],
    queryFn: () => api.dashboard.getUpcomingTasks(5) as Promise<UpcomingTask[]>,
    staleTime: 30000,
  });

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="sf-card p-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.todaysTasks', "Today's Tasks")}
        </h2>
        <button className="p-1.5 rounded-md text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <Link
                key={task.id}
                href={`/tasks?task=${task.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm hover:bg-gray-50 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className={cn('flex-shrink-0 w-1 h-8 rounded-full',
                  task.priority === 'URGENT' ? 'bg-red-500' :
                  task.priority === 'HIGH' ? 'bg-orange-500' :
                  task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-300'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.project && (
                    <p className="text-xs text-gray-500 truncate">{task.project.name}</p>
                  )}
                </div>
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyStateIllustration variant="tasks" />
        )}
      </div>
    </div>
  );
}

function MetricsRow() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="sf-card p-4 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: t('dashboard.totalContacts', 'Total Contacts'),
      value: stats?.contacts?.total || 0,
      change: stats?.contacts?.change || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: t('dashboard.companies', 'Companies'),
      value: stats?.companies?.total || 0,
      change: stats?.companies?.change || 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: t('dashboard.openDeals', 'Open Deals'),
      value: `$${(stats?.deals?.value || 0).toLocaleString()}`,
      change: stats?.deals?.change || 0,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: t('dashboard.tasksDue', 'Tasks Due'),
      value: stats?.tasks?.due || 0,
      change: stats?.tasks?.completed || 0,
      changeLabel: t('common.completed', 'completed'),
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 stagger-children">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className="sf-card p-4 hover-lift"
        >
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
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 animate-fade-in">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          {t('dashboard.welcomeMessage', 'Welcome to your CRM dashboard. Customize this page to show the information most important to you.')}
        </p>
        <button className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
          {t('dashboard.customize', 'Customize')}
        </button>
      </div>

      {/* Metrics row */}
      <MetricsRow />

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <QuarterlyPerformanceWidget />

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-6">
            <TodaysEventsWidget />
            <TodaysTasksWidget />
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <AssistantWidget />

          {/* Quick Actions */}
          <div className="sf-card p-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {t('dashboard.quickActions', 'Quick Actions')}
            </h3>
            <div className="space-y-2">
              <Link
                href="/contacts"
                className="flex items-center gap-3 p-2 rounded-md transition-all duration-150 hover:bg-blue-50 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {t('dashboard.addContact', 'Add Contact')}
                </span>
              </Link>
              <Link
                href="/companies"
                className="flex items-center gap-3 p-2 rounded-md transition-all duration-150 hover:bg-emerald-50 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Plus className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                  {t('dashboard.addCompany', 'Add Company')}
                </span>
              </Link>
              <Link
                href="/deals"
                className="flex items-center gap-3 p-2 rounded-md transition-all duration-150 hover:bg-amber-50 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 group-hover:bg-amber-200 transition-colors">
                  <Plus className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors">
                  {t('dashboard.createDeal', 'Create Deal')}
                </span>
              </Link>
              <Link
                href="/tasks"
                className="flex items-center gap-3 p-2 rounded-md transition-all duration-150 hover:bg-violet-50 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 group-hover:bg-violet-200 transition-colors">
                  <Plus className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-violet-600 transition-colors">
                  {t('dashboard.addTask', 'Add Task')}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
