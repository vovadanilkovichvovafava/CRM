'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
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

export default function TimeTrackingPage() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(now);

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
  const { data, isLoading } = useQuery({
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
      toast.success('Time entry deleted');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete time entry');
      }
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const entries = data?.data || [];

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = formatDate(entry.startTime);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Time Tracking</h1>
            <p className="text-sm text-white/40">
              {stats?.entriesCount || 0} entries • {stats?.totalHours || 0} hours tracked
            </p>
          </div>
        </div>
      </div>

      {/* Timer Widget */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/50 px-6 py-4">
        <TimerWidget />
      </div>

      {/* Stats */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/30 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Timer className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalHours || 0}h</p>
                  <p className="text-xs text-white/40">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${stats?.billableAmount?.toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-white/40">Billable</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.entriesCount || 0}</p>
                  <p className="text-xs text-white/40">Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatMinutes(stats?.billableMinutes || 0)}
                  </p>
                  <p className="text-xs text-white/40">Billable Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/50 px-6 py-3">
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              variant={dateFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter(filter)}
              className={cn(
                dateFilter === filter
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'border-white/10 text-white/60 hover:text-white'
              )}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Clock className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/40 mb-2">No time entries yet</p>
            <p className="text-sm text-white/30">Start the timer to track your time</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white/60">{date}</h3>
                  <span className="text-xs text-white/40">
                    {formatMinutes(dayEntries.reduce((sum, e) => sum + e.duration, 0))}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <Clock className="h-5 w-5 text-amber-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {entry.description || entry.task?.title || 'No description'}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatTime(entry.startTime)}
                          {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {entry.isBillable && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Billable
                          </span>
                        )}
                        <span className="text-sm font-mono font-medium text-white">
                          {formatMinutes(entry.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
