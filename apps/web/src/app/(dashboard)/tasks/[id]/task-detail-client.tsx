'use client';

import { useState, useCallback } from 'react';
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
  PlayCircle,
  PauseCircle,
  ChevronDown,
  Search,
  Filter,
  Send,
  Plus,
  Link as LinkIcon,
  Tag,
  Timer,
  Upload,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
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
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; color?: string };
  assignee?: { id: string; name?: string; email: string; avatar?: string };
  createdBy?: { id: string; name?: string; email: string };
  parent?: { id: string; title: string };
  subtasks?: Task[];
  tags?: { id: string; name: string; color: string }[];
  _count?: { subtasks: number; comments: number; files: number };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name?: string; email: string; avatar?: string };
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'comment';
  description: string;
  createdAt: string;
  user?: { id: string; name?: string; email: string; avatar?: string };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  TODO: {
    label: 'To Do',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <Circle className="h-4 w-4" />
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <PlayCircle className="h-4 w-4" />
  },
  IN_REVIEW: {
    label: 'In Review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <PauseCircle className="h-4 w-4" />
  },
  DONE: {
    label: 'Done',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  URGENT: { label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-100' },
  HIGH: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  LOW: { label: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

// Field row component for the two-column grid
function FieldRow({
  icon: Icon,
  label,
  children,
  isEmpty = false
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className={cn("flex-1", isEmpty && "text-gray-400 text-sm")}>
        {children}
      </div>
    </div>
  );
}

// Status badge with dropdown behavior
function StatusBadge({ status, onStatusChange }: { status: string; onStatusChange: (status: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[status] || statusConfig.TODO;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-all",
          config.bgColor,
          config.color
        )}
      >
        {config.icon}
        {config.label}
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => {
                  onStatusChange(key);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                  status === key && "bg-gray-50"
                )}
              >
                <span className={cfg.color}>{cfg.icon}</span>
                {cfg.label}
                {status === key && <CheckCircle2 className="h-3 w-3 ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TaskDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'actionItems'>('details');
  const [commentText, setCommentText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => api.tasks.get(taskId) as Promise<Task>,
    enabled: !!taskId && taskId !== '_placeholder',
  });

  // Mock activities for demo
  const activities: Activity[] = task ? [
    { id: '1', type: 'created', description: 'created this task', createdAt: task.createdAt, user: task.createdBy },
    ...(task.assignee ? [{
      id: '2',
      type: 'assigned' as const,
      description: `assigned to: ${task.assignee.name || task.assignee.email}`,
      createdAt: task.createdAt
    }] : []),
  ] : [];

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      toast.info(`${files.length} file(s) would be uploaded`);
    }
  }, []);

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
        <AlertCircle className="h-12 w-12 text-gray-300" />
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
  const shortId = task.id.slice(0, 8);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Link
            href="/tasks"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Link>

          {/* Task Type Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Task</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>

          {/* Task ID */}
          <span className="text-sm text-gray-400 font-mono">{shortId}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1.5" />
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Task Details */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h1>

            {/* Fields Grid - Two Columns */}
            <div className="grid grid-cols-2 gap-x-8 mb-6">
              {/* Left Column */}
              <div className="space-y-1">
                <FieldRow icon={AlertCircle} label={t('tasks.fields.status')}>
                  <StatusBadge
                    status={task.status}
                    onStatusChange={(s) => updateStatusMutation.mutate(s)}
                  />
                </FieldRow>

                <FieldRow icon={Calendar} label={t('tasks.fields.dates')}>
                  {task.startDate || task.dueDate ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span>{task.startDate ? format(new Date(task.startDate), 'MMM d') : '—'}</span>
                      <span className="text-gray-400">→</span>
                      <span className={cn(
                        task.dueDate && new Date(task.dueDate) < new Date() && 'text-red-600'
                      )}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Empty</span>
                  )}
                </FieldRow>

                <FieldRow icon={Timer} label={t('tasks.fields.timeEstimate')}>
                  {task.estimatedHours ? (
                    <span className="text-sm">{task.estimatedHours}h</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Empty</span>
                  )}
                </FieldRow>

                <FieldRow icon={Tag} label={t('tasks.fields.tags')}>
                  {task.tags && task.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          style={{ backgroundColor: tag.color }}
                          className="text-white text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Empty</span>
                  )}
                </FieldRow>
              </div>

              {/* Right Column */}
              <div className="space-y-1">
                <FieldRow icon={User} label={t('tasks.fields.assignees')}>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name || task.assignee.email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Empty</span>
                  )}
                </FieldRow>

                <FieldRow icon={Flag} label={t('tasks.fields.priority')}>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-sm font-medium",
                    priority.bgColor,
                    priority.color
                  )}>
                    {priority.label}
                  </span>
                </FieldRow>

                <FieldRow icon={Clock} label={t('tasks.fields.trackTime')}>
                  <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
                    <PlayCircle className="h-4 w-4" />
                    Add time
                  </button>
                </FieldRow>

                <FieldRow icon={LinkIcon} label={t('tasks.fields.relationships')}>
                  <span className="text-gray-400 text-sm">Empty</span>
                </FieldRow>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="prose prose-sm max-w-none text-gray-700">
                  {task.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6">
                {[
                  { key: 'details', label: t('common.details') },
                  { key: 'subtasks', label: t('tasks.subtasks'), count: task._count?.subtasks },
                  { key: 'actionItems', label: t('tasks.actionItems') },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={cn(
                      "pb-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1.5 text-gray-400">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Custom Fields Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('tasks.customFields')}</h3>
                  <div className="text-sm text-gray-500 py-4 border border-dashed border-gray-200 rounded-lg text-center">
                    {t('tasks.noCustomFields')}
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('tasks.attachments')}</h3>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg py-8 text-center transition-colors",
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {t('tasks.dropFilesHere')} <button className="text-blue-600 hover:underline">{t('tasks.upload')}</button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="text-center py-12">
                <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('tasks.noSubtasks')}</p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t('tasks.addSubtask')}
                </Button>
              </div>
            )}

            {activeTab === 'actionItems' && (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('tasks.noActionItems')}</p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t('tasks.addActionItem')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Activity */}
        <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          {/* Activity Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('tasks.activity')}</h2>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                <Filter className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-1 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user?.avatar} />
                        <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                          {activity.user?.name?.charAt(0) || activity.user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">
                            {activity.user?.name || activity.user?.email || 'You'}
                          </span>
                          {' '}
                          <span className="text-gray-500">{activity.description}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(activity.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Comments placeholder */}
              {(task._count?.comments || 0) === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t('tasks.noComments')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-sm">U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('tasks.writeComment')}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <Button
                    size="sm"
                    disabled={!commentText.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {t('common.send')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
