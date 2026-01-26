'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import {
  Users,
  Building2,
  DollarSign,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Clock,
  Zap,
  Eye,
  History,
  Loader2,
  CalendarClock,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';

interface StatCardData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  href: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function StatCard({ stat, vsLastMonthText }: { stat: StatCardData; vsLastMonthText: string }) {
  return (
    <Link
      href={stat.href}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon className="h-5 w-5 text-white" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-white/50">{stat.title}</p>
          <p className="text-3xl font-bold text-white">{stat.value}</p>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {stat.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className={stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
            {stat.change}
          </span>
          <span className="text-white/30 text-sm">{vsLastMonthText}</span>
        </div>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  activity: { id: string; type: string; title: string; description: string | null; occurredAt: string };
  timeAgoTexts: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
}

function ActivityItem({ activity, timeAgoTexts }: ActivityItemProps) {
  const typeColors: Record<string, string> = {
    NOTE: 'bg-blue-500/10 text-blue-400',
    EMAIL_SENT: 'bg-emerald-500/10 text-emerald-400',
    EMAIL_RECEIVED: 'bg-teal-500/10 text-teal-400',
    CALL_MADE: 'bg-amber-500/10 text-amber-400',
    CALL_RECEIVED: 'bg-orange-500/10 text-orange-400',
    MEETING: 'bg-pink-500/10 text-pink-400',
    TASK_CREATED: 'bg-violet-500/10 text-violet-400',
    TASK_COMPLETED: 'bg-green-500/10 text-green-400',
    STAGE_CHANGED: 'bg-indigo-500/10 text-indigo-400',
    FIELD_UPDATED: 'bg-slate-500/10 text-slate-400',
    FILE_UPLOADED: 'bg-cyan-500/10 text-cyan-400',
    COMMENT_ADDED: 'bg-purple-500/10 text-purple-400',
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return timeAgoTexts.justNow;
    if (diffMins < 60) return timeAgoTexts.minutesAgo.replace('{{count}}', String(diffMins));
    if (diffHours < 24) return timeAgoTexts.hoursAgo.replace('{{count}}', String(diffHours));
    return timeAgoTexts.daysAgo.replace('{{count}}', String(diffDays));
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeColors[activity.type] || 'bg-white/10 text-white/60'}`}>
        <Zap className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-white/40 truncate">{activity.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-white/30">
        <Clock className="h-3 w-3" />
        {timeAgo(activity.occurredAt)}
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

interface TaskItemProps {
  task: UpcomingTask;
  dateTexts: {
    overdue: string;
    today: string;
    tomorrow: string;
    daysFormat: string;
  };
}

function TaskItem({ task, dateTexts }: TaskItemProps) {
  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const dueDate = new Date(date);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return { text: dateTexts.overdue, isOverdue: true };
    if (diffDays === 0) return { text: dateTexts.today, isOverdue: false };
    if (diffDays === 1) return { text: dateTexts.tomorrow, isOverdue: false };
    return { text: dateTexts.daysFormat.replace('{{count}}', String(diffDays)), isOverdue: false };
  };

  const dueDateInfo = formatDueDate(task.dueDate);

  return (
    <Link
      href={`/tasks?task=${task.id}`}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-3 px-3 rounded-lg transition-colors"
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${priorityColors[task.priority] || 'bg-white/10'}`}>
        {task.priority === 'URGENT' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckSquare className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{task.title}</p>
        {task.project && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <FolderKanban className="h-3 w-3" />
            {task.project.name}
          </div>
        )}
      </div>
      {dueDateInfo && (
        <span className={`text-xs px-2 py-1 rounded-full ${dueDateInfo.isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/50'}`}>
          {dueDateInfo.text}
        </span>
      )}
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
            <div className="h-10 w-10 rounded-xl bg-white/10 mb-4" />
            <div className="h-4 w-24 bg-white/10 rounded mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => api.dashboard.getRecentActivities(10),
    staleTime: 30000,
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-tasks'],
    queryFn: () => api.dashboard.getUpcomingTasks(5),
    staleTime: 30000,
  });

  const quickActions = [
    { label: t('dashboard.addContact'), icon: Users, color: 'text-blue-400', href: '/contacts' },
    { label: t('dashboard.addCompany'), icon: Building2, color: 'text-emerald-400', href: '/companies' },
    { label: t('dashboard.createDeal'), icon: DollarSign, color: 'text-amber-400', href: '/deals' },
    { label: t('dashboard.addTask'), icon: CheckSquare, color: 'text-violet-400', href: '/tasks' },
  ];

  const timeAgoTexts = {
    justNow: t('common.justNow'),
    minutesAgo: t('common.minutesAgo'),
    hoursAgo: t('common.hoursAgo'),
    daysAgo: t('common.daysAgo'),
  };

  const dateTexts = {
    overdue: t('common.overdue'),
    today: t('common.today'),
    tomorrow: t('common.tomorrow'),
    daysFormat: t('common.daysFormat'),
  };

  const statCards: StatCardData[] = stats
    ? [
        {
          title: t('dashboard.totalContacts'),
          value: formatNumber(stats.contacts.total),
          change: `${stats.contacts.change >= 0 ? '+' : ''}${stats.contacts.change}%`,
          trend: stats.contacts.change >= 0 ? 'up' : 'down',
          icon: Users,
          gradient: 'from-blue-500 to-cyan-500',
          href: '/contacts',
        },
        {
          title: t('dashboard.companies'),
          value: formatNumber(stats.companies.total),
          change: `${stats.companies.change >= 0 ? '+' : ''}${stats.companies.change}%`,
          trend: stats.companies.change >= 0 ? 'up' : 'down',
          icon: Building2,
          gradient: 'from-emerald-500 to-green-500',
          href: '/companies',
        },
        {
          title: t('dashboard.openDeals'),
          value: formatCurrency(stats.deals.value),
          change: `${stats.deals.change >= 0 ? '+' : ''}${stats.deals.change}%`,
          trend: stats.deals.change >= 0 ? 'up' : 'down',
          icon: DollarSign,
          gradient: 'from-amber-500 to-orange-500',
          href: '/deals',
        },
        {
          title: t('dashboard.tasksDue'),
          value: String(stats.tasks.due),
          change: `${stats.tasks.completed} ${t('common.completed')}`,
          trend: stats.tasks.due <= 5 ? 'up' : 'down',
          icon: CheckSquare,
          gradient: 'from-violet-500 to-purple-500',
          href: '/tasks',
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-6 w-6 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
          </div>
          <p className="text-white/50">
            <span className="text-sky-400">{t('dashboard.seePast')}</span>
            <span className="mx-2">·</span>
            <span className="text-purple-400">{t('dashboard.buildFuture')}</span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25">
          <Plus className="h-4 w-4" />
          {t('dashboard.quickAdd')}
        </button>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.title} stat={stat} vsLastMonthText={t('common.vsLastMonth')} />
          ))}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">{t('dashboard.recentActivity')}</h2>
            </div>
            <button className="text-sm text-white/40 hover:text-white transition-colors">
              {t('common.viewAll')}
            </button>
          </div>
          <div>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} timeAgoTexts={timeAgoTexts} />
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.noRecentActivities')}</p>
                <p className="text-sm mt-1">{t('dashboard.activitiesWillAppear')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">{t('dashboard.upcomingTasks')}</h2>
              </div>
              <Link href="/tasks" className="text-sm text-white/40 hover:text-white transition-colors">
                {t('common.viewAll')}
              </Link>
            </div>
            <div>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                </div>
              ) : upcomingTasks && upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} dateTexts={dateTexts} />
                ))
              ) : (
                <div className="text-center py-6 text-white/40">
                  <CheckSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('dashboard.noUpcomingTasks')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('dashboard.quickActions')}</h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                  <Plus className="h-4 w-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
                </Link>
              ))}
            </div>

            {/* Janus Tip */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/50">
                  {t('dashboard.pressToSearch')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
