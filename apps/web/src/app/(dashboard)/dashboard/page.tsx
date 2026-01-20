'use client';

import Link from 'next/link';
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
} from 'lucide-react';

const stats = [
  {
    title: 'Total Contacts',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    href: '/contacts',
  },
  {
    title: 'Companies',
    value: '423',
    change: '+8%',
    trend: 'up',
    icon: Building2,
    gradient: 'from-emerald-500 to-green-500',
    href: '/companies',
  },
  {
    title: 'Open Deals',
    value: '$1.2M',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-500',
    href: '/deals',
  },
  {
    title: 'Tasks Due',
    value: '18',
    change: '-5%',
    trend: 'down',
    icon: CheckSquare,
    gradient: 'from-violet-500 to-purple-500',
    href: '/tasks',
  },
];

const recentActivities = [
  { id: 1, action: 'New contact added', name: 'John Smith', time: '5m ago', type: 'contact' },
  { id: 2, action: 'Deal moved to Negotiation', name: 'Enterprise License', time: '15m ago', type: 'deal' },
  { id: 3, action: 'Task completed', name: 'Follow up with client', time: '1h ago', type: 'task' },
  { id: 4, action: 'New webmaster registered', name: 'TrafficKing', time: '2h ago', type: 'webmaster' },
  { id: 5, action: 'Meeting scheduled', name: 'Product Demo', time: '3h ago', type: 'meeting' },
];

const quickActions = [
  { label: 'Add Contact', icon: Users, color: 'text-blue-400', href: '/contacts' },
  { label: 'Add Company', icon: Building2, color: 'text-emerald-400', href: '/companies' },
  { label: 'Create Deal', icon: DollarSign, color: 'text-amber-400', href: '/deals' },
  { label: 'Add Task', icon: CheckSquare, color: 'text-violet-400', href: '/tasks' },
];

function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <Link
      href={stat.href}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
    >
      {/* Background gradient on hover */}
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
          <span className="text-white/30 text-sm">vs last month</span>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: typeof recentActivities[0] }) {
  const typeColors: Record<string, string> = {
    contact: 'bg-blue-500/10 text-blue-400',
    deal: 'bg-amber-500/10 text-amber-400',
    task: 'bg-violet-500/10 text-violet-400',
    webmaster: 'bg-emerald-500/10 text-emerald-400',
    meeting: 'bg-pink-500/10 text-pink-400',
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeColors[activity.type]}`}>
        <Zap className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{activity.action}</p>
        <p className="text-xs text-white/40 truncate">{activity.name}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-white/30">
        <Clock className="h-3 w-3" />
        {activity.time}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors">
          <Plus className="h-4 w-4" />
          Quick Add
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-white/40 hover:text-white transition-colors">
              View all
            </button>
          </div>
          <div>
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
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

          {/* Tips Section */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Pro Tip</p>
                <p className="text-xs text-white/50 mt-1">
                  Use keyboard shortcuts to navigate faster. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">⌘K</kbd> to search.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
