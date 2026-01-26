'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function TimerWidget({ className }: { className?: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');

  // Get active timer
  const { data: activeTimer, isLoading } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: () => api.timeEntries.getActiveTimer(),
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Update elapsed time
  useEffect(() => {
    if (!activeTimer?.startTime) {
      setElapsed('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      setElapsed(formatDuration(activeTimer.startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  // Start timer mutation
  const startMutation = useMutation({
    mutationFn: () => api.timeEntries.startTimer({ description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setDescription('');
      toast.success(t('timeTracking.timerStarted'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: (id: string) => api.timeEntries.stopTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success(t('timeTracking.timerStopped'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  const handleToggle = () => {
    if (activeTimer) {
      stopMutation.mutate(activeTimer.id);
    } else {
      startMutation.mutate();
    }
  };

  const isPending = startMutation.isPending || stopMutation.isPending;

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
        <Clock className="h-5 w-5 text-amber-600" />
      </div>

      <div className="flex-1 min-w-0">
        {activeTimer ? (
          <div>
            <p className="text-lg font-mono font-semibold text-gray-900">{elapsed}</p>
            <p className="text-xs text-gray-500 truncate">
              {activeTimer.description || activeTimer.task?.title || t('timeTracking.noDescription')}
            </p>
          </div>
        ) : (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('timeTracking.whatAreYouWorkingOn')}
            className="h-8 bg-white border-gray-200 p-0 px-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#0070d2]"
          />
        )}
      </div>

      <Button
        onClick={handleToggle}
        disabled={isPending || isLoading}
        size="icon"
        className={cn(
          'h-10 w-10 rounded-full',
          activeTimer
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-emerald-500 hover:bg-emerald-600'
        )}
      >
        {isPending || isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : activeTimer ? (
          <Square className="h-4 w-4" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>
    </div>
  );
}
