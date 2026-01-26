'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock, Loader2, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UpcomingTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
}

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <svg
        viewBox="0 0 120 80"
        className="w-24 h-16 mb-3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="120" height="80" fill="#f0f7ff" rx="6" />
        <g className="animate-float" style={{ animationDelay: '0.5s' }}>
          <path d="M30 30 Q35 25 40 30" stroke="#0070d2" strokeWidth="1.5" fill="none" />
          <path d="M80 25 Q85 20 90 25" stroke="#0070d2" strokeWidth="1.5" fill="none" />
        </g>
        <path d="M0 80 L30 50 L60 80 Z" fill="#a8d5e5" />
        <path d="M60 80 L90 55 L120 80 Z" fill="#7ec8e3" />
        <rect x="50" y="55" width="3" height="12" fill="#8b6914" />
        <path d="M51 45 L58 55 L44 55 Z" fill="#52b788" />
      </svg>
    </div>
  );
}

export function TodaysTasksWidget() {
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-tasks'],
    queryFn: () => api.dashboard.getUpcomingTasks(5) as Promise<UpcomingTask[]>,
    staleTime: 30000,
  });

  return (
    <div className="sf-card h-full p-0 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-violet-500" />
          <h2 className="text-base font-semibold text-gray-900">
            {t('dashboard.todaysTasks', "Today's Tasks")}
          </h2>
        </div>
        <button className="p-1 rounded-md text-gray-400 hover:bg-gray-100">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks?task=${task.id}`}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                <div className={cn('flex-shrink-0 w-1 h-6 rounded-full',
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
          <EmptyStateIllustration />
        )}
      </div>
    </div>
  );
}
