'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  MessageSquare,
  Paperclip,
  ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; color?: string };
  assignee?: { id: string; name?: string; email: string; avatar?: string };
  createdBy?: { id: string; name?: string; email: string };
  parent?: { id: string; title: string };
  subtasks?: Task[];
  _count?: { subtasks: number; comments: number; files: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  TODO: { label: 'To Do', color: 'bg-gray-500', icon: <Circle className="h-4 w-4" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500', icon: <Clock className="h-4 w-4" /> },
  IN_REVIEW: { label: 'In Review', color: 'bg-yellow-500', icon: <ListChecks className="h-4 w-4" /> },
  DONE: { label: 'Done', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500 text-white' },
  HIGH: { label: 'High', color: 'bg-orange-500 text-white' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-500 text-white' },
  LOW: { label: 'Low', color: 'bg-gray-500 text-white' },
};

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-1/3 flex-shrink-0">
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function TaskDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments'>('details');

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => api.tasks.get(taskId) as Promise<Task>,
    enabled: !!taskId && taskId !== '_placeholder',
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.tasks.delete(taskId),
    onSuccess: () => {
      toast.success(t('tasks.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/tasks');
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.tasks.update(taskId, { status }),
    onSuccess: () => {
      toast.success(t('tasks.messages.updated'));
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f4f6f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f9]">
        <p className="text-gray-500">{t('tasks.notFound')}</p>
        <Button onClick={() => router.push('/tasks')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const status = statusConfig[task.status] || statusConfig.TODO;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/tasks"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* Task Info */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-lg', status.color, 'text-white')}>
              {status.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-500">{t('tasks.title')}</span>
                <Badge className={priority.color}>{priority.label}</Badge>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
              {task.description && (
                <p className="text-gray-600 mt-2">{task.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={task.status === key ? 'default' : 'outline'}
              size="sm"
              className={task.status === key ? config.color : ''}
              onClick={() => updateStatusMutation.mutate(key)}
              disabled={updateStatusMutation.isPending}
            >
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="sf-card mb-6">
            <div className="border-b border-gray-200">
              <div className="flex">
                {(['details', 'subtasks', 'comments'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                      activeTab === tab
                        ? 'border-[#0070d2] text-[#0070d2]'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {tab === 'details' && t('common.details')}
                    {tab === 'subtasks' && `${t('tasks.subtasks')} (${task._count?.subtasks || 0})`}
                    {tab === 'comments' && `${t('tasks.comments')} (${task._count?.comments || 0})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <div>
                  <DetailField label={t('tasks.fields.status')}>
                    <Badge className={status.color + ' text-white'}>{status.label}</Badge>
                  </DetailField>
                  <DetailField label={t('tasks.fields.priority')}>
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </DetailField>
                  <DetailField label={t('tasks.fields.assignee')}>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs bg-indigo-500 text-white">
                            {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">
                          {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{t('common.unassigned')}</span>
                    )}
                  </DetailField>
                  <DetailField label={t('tasks.fields.dueDate')}>
                    {task.dueDate ? (
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {format(new Date(task.dueDate), 'PPP')}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </DetailField>
                  <DetailField label={t('tasks.fields.project')}>
                    {task.project ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: task.project.color || '#6366f1' }}
                        />
                        <span className="text-sm text-gray-900">{task.project.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </DetailField>
                  <DetailField label={t('common.createdAt')}>
                    <span className="text-sm text-gray-900">
                      {format(new Date(task.createdAt), 'PPP p')}
                    </span>
                  </DetailField>
                </div>
              )}

              {activeTab === 'subtasks' && (
                <div className="text-center py-8 text-gray-500">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('tasks.noSubtasks')}</p>
                  <Button className="mt-4" variant="outline">
                    {t('tasks.addSubtask')}
                  </Button>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('tasks.noComments')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto">
          <h3 className="font-medium text-gray-900 mb-4">{t('common.quickInfo')}</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('tasks.fields.assignee')}</p>
                <p className="text-sm text-gray-900">
                  {task.assignee?.name || task.assignee?.email || t('common.unassigned')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('tasks.fields.dueDate')}</p>
                <p className="text-sm text-gray-900">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Flag className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('tasks.fields.priority')}</p>
                <Badge className={priority.color}>{priority.label}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Paperclip className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('common.files')}</p>
                <p className="text-sm text-gray-900">{task._count?.files || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
