'use client';

import { useState, useEffect } from 'react';
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
      toast.success('Timer started');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to start timer');
      }
    },
  });

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: (id: string) => api.timeEntries.stopTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Timer stopped');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to stop timer');
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
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
        <Clock className="h-5 w-5 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        {activeTimer ? (
          <div>
            <p className="text-lg font-mono font-semibold text-white">{elapsed}</p>
            <p className="text-xs text-white/40 truncate">
              {activeTimer.description || activeTimer.task?.title || 'No description'}
            </p>
          </div>
        ) : (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="h-8 bg-transparent border-0 p-0 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
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
