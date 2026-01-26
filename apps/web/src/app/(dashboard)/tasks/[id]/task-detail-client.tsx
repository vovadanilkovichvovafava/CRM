'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Plus,
  Link as LinkIcon,
  Tag,
  AlertCircle,
  X,
  Check,
  Upload,
  Download,
  Image,
  FileText,
  FileSpreadsheet,
  File as FileIconGeneric,
  Reply,
  Send,
  Heart,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  assigneeId?: string;
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

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'comment';
  description: string;
  createdAt: string;
  user?: { id: string; name?: string; email: string; avatar?: string };
}

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface CommentAuthor {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  parentId?: string;
  replies?: CommentItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-emerald-500" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <FileIconGeneric className="h-5 w-5 text-gray-400" />;
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

// Generic Dropdown Component
function Dropdown<T extends string>({
  value,
  options,
  onChange,
  renderOption,
  renderValue,
  disabled = false,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
  renderValue: (value: T) => React.ReactNode;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1 transition-all cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {renderValue(value)}
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[180px]">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              {renderOption(option, value === option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// User Selector Dropdown
function UserSelector({
  value,
  users,
  onChange,
  disabled = false,
}: {
  value?: string;
  users: User[];
  onChange: (userId: string | undefined) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedUser = users.find(u => u.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {selectedUser ? (
          <>
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{selectedUser.name || selectedUser.email}</span>
          </>
        ) : (
          <span className="text-gray-400 text-sm">Empty</span>
        )}
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[220px] max-h-64 overflow-y-auto">
          <button
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-500"
          >
            <X className="h-4 w-4" />
            Unassign
          </button>
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onChange(user.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                value === user.id && "bg-blue-50"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs bg-blue-500 text-white">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user.name || user.email}</span>
              {value === user.id && <Check className="h-4 w-4 ml-auto text-blue-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Date Picker Field
function DateField({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value?: string;
  onChange: (date: string | undefined) => void;
  label: string;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="date"
          defaultValue={value ? value.split('T')[0] : ''}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onBlur={(e) => {
            const newValue = e.target.value;
            onChange(newValue || undefined);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newValue = (e.target as HTMLInputElement).value;
              onChange(newValue || undefined);
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              setIsEditing(false);
            }
          }}
          disabled={disabled}
        />
        <button
          onClick={() => {
            onChange(undefined);
            setIsEditing(false);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "text-sm hover:bg-gray-100 px-2 py-1 rounded transition-colors",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      disabled={disabled}
    >
      {value ? format(new Date(value), 'MMM d, yyyy') : <span className="text-gray-400">Empty</span>}
    </button>
  );
}

// Field row component
function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export function TaskDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch task
  const { data: task, isLoading, error } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => api.tasks.get(taskId) as Promise<Task>,
    enabled: !!taskId && taskId !== '_placeholder',
  });

  // Fetch users for assignee selector
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list() as Promise<User[]>,
  });

  // Activities
  const activities: Activity[] = task ? [
    { id: '1', type: 'created', description: 'created this task', createdAt: task.createdAt, user: task.createdBy },
    ...(task.assignee ? [{
      id: '2',
      type: 'assigned' as const,
      description: `assigned to: ${task.assignee.name || task.assignee.email}`,
      createdAt: task.createdAt
    }] : []),
  ] : [];

  // Fetch files for this task
  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['files', 'task', taskId],
    queryFn: () => api.files.listByTask(taskId) as Promise<FileItem[]>,
    enabled: !!taskId && taskId !== '_placeholder',
  });

  // Fetch comments for this task
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['comments', 'task', taskId],
    queryFn: () => api.comments.listByTask(taskId) as Promise<CommentItem[]>,
    enabled: !!taskId && taskId !== '_placeholder',
  });

  // Comment states
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.tasks.update(taskId, data),
    onSuccess: () => {
      toast.success(t('tasks.messages.updated'));
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
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

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) => api.tasks.create({
      title,
      parentId: taskId,
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: task?.project?.id,
    }),
    onSuccess: () => {
      toast.success(t('tasks.messages.created'));
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => api.files.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', 'task', taskId] });
      toast.success(t('files.delete'));
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      api.comments.create({ ...data, taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => api.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  // Comment handlers
  const handleSendComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ content: commentText.trim() });
  };

  const handleSendReply = (parentId: string) => {
    if (!replyText.trim()) return;
    createCommentMutation.mutate({ content: replyText.trim(), parentId });
  };

  // File upload handler
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await api.files.upload(file, { taskId });
      }
      queryClient.invalidateQueries({ queryKey: ['files', 'task', taskId] });
      toast.success(t('common.upload'));
    } catch {
      toast.error(t('errors.general'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [taskId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = '';
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`${t('common.delete')} "${name}"?`)) {
      deleteFileMutation.mutate(id);
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    window.open(api.files.getDownloadUrl(file.id), '_blank');
  };

  // Update handlers
  const handleUpdateStatus = (status: string) => {
    updateTaskMutation.mutate({ status } as Partial<Task>);
  };

  const handleUpdatePriority = (priority: string) => {
    updateTaskMutation.mutate({ priority } as Partial<Task>);
  };

  const handleUpdateAssignee = (assigneeId: string | undefined) => {
    updateTaskMutation.mutate({ assigneeId } as Partial<Task>);
  };

  const handleUpdateDueDate = (dueDate: string | undefined) => {
    updateTaskMutation.mutate({ dueDate } as Partial<Task>);
  };

  const handleUpdateStartDate = (startDate: string | undefined) => {
    updateTaskMutation.mutate({ startDate } as Partial<Task>);
  };

  const handleOpenEditDialog = () => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    updateTaskMutation.mutate({
      title: editTitle,
      description: editDescription || undefined,
    } as Partial<Task>, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
      }
    });
  };

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
  const isUpdating = updateTaskMutation.isPending;

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

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Task</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>

          <span className="text-sm text-gray-400 font-mono">{shortId}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
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
                  <Dropdown
                    value={task.status}
                    options={['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']}
                    onChange={handleUpdateStatus}
                    disabled={isUpdating}
                    renderValue={(val) => {
                      const cfg = statusConfig[val] || statusConfig.TODO;
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium", cfg.bgColor, cfg.color)}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      );
                    }}
                    renderOption={(opt, isSelected) => {
                      const cfg = statusConfig[opt] || statusConfig.TODO;
                      return (
                        <span className="flex items-center gap-2">
                          <span className={cfg.color}>{cfg.icon}</span>
                          {cfg.label}
                          {isSelected && <Check className="h-4 w-4 ml-auto text-blue-500" />}
                        </span>
                      );
                    }}
                  />
                </FieldRow>

                <FieldRow icon={Calendar} label={t('tasks.fields.dates')}>
                  <div className="flex items-center gap-2 text-sm">
                    <DateField
                      value={task.startDate}
                      onChange={handleUpdateStartDate}
                      label="Start"
                      disabled={isUpdating}
                    />
                    <span className="text-gray-400">→</span>
                    <DateField
                      value={task.dueDate}
                      onChange={handleUpdateDueDate}
                      label="Due"
                      disabled={isUpdating}
                    />
                  </div>
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
                    <button className="text-gray-400 text-sm hover:bg-gray-100 px-2 py-1 rounded">
                      Empty
                    </button>
                  )}
                </FieldRow>
              </div>

              {/* Right Column */}
              <div className="space-y-1">
                <FieldRow icon={User} label={t('tasks.fields.assignees')}>
                  <UserSelector
                    value={task.assigneeId}
                    users={users}
                    onChange={handleUpdateAssignee}
                    disabled={isUpdating}
                  />
                </FieldRow>

                <FieldRow icon={Flag} label={t('tasks.fields.priority')}>
                  <Dropdown
                    value={task.priority}
                    options={['URGENT', 'HIGH', 'MEDIUM', 'LOW']}
                    onChange={handleUpdatePriority}
                    disabled={isUpdating}
                    renderValue={(val) => {
                      const cfg = priorityConfig[val] || priorityConfig.MEDIUM;
                      return (
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-sm font-medium", cfg.bgColor, cfg.color)}>
                          {cfg.label}
                        </span>
                      );
                    }}
                    renderOption={(opt, isSelected) => {
                      const cfg = priorityConfig[opt] || priorityConfig.MEDIUM;
                      return (
                        <span className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full", cfg.bgColor)} />
                          {cfg.label}
                          {isSelected && <Check className="h-4 w-4 ml-auto text-blue-500" />}
                        </span>
                      );
                    }}
                  />
                </FieldRow>

                <FieldRow icon={Clock} label={t('tasks.fields.trackTime')}>
                  <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                    <PlayCircle className="h-4 w-4" />
                    Add time
                  </button>
                </FieldRow>

                <FieldRow icon={LinkIcon} label={t('tasks.fields.relationships')}>
                  <button className="text-gray-400 text-sm hover:bg-gray-100 px-2 py-1 rounded">
                    Empty
                  </button>
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
                  { key: 'subtasks', label: t('tasks.subtasks'), count: task._count?.subtasks || task.subtasks?.length || 0 },
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
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    {t('tasks.attachments')}
                    {files.length > 0 && (
                      <span className="text-gray-400 font-normal">({files.length})</span>
                    )}
                  </h3>

                  {/* Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4",
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-sm text-gray-500">{t('common.loading')}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          {t('tasks.dropFilesHere')} <span className="text-blue-600">{t('tasks.upload')}</span>
                        </p>
                        <p className="text-xs text-gray-400">Max 10MB</p>
                      </div>
                    )}
                  </div>

                  {/* Files List */}
                  {isLoadingFiles ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  ) : files.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">{t('files.noFiles')}</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 group transition-colors cursor-pointer"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(file.size)} • {format(new Date(file.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-blue-600"
                              onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                              title={t('files.preview')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }}
                              title={t('common.download')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.originalName); }}
                              disabled={deleteFileMutation.isPending}
                              title={t('common.delete')}
                            >
                              {deleteFileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                {/* Subtask List */}
                {task.subtasks && task.subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {task.subtasks.map((subtask) => {
                      const subtaskStatus = statusConfig[subtask.status] || statusConfig.TODO;
                      const subtaskPriority = priorityConfig[subtask.priority] || priorityConfig.MEDIUM;
                      return (
                        <div
                          key={subtask.id}
                          onClick={() => router.push(`/tasks/${subtask.id}`)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskMutation.mutate({
                                status: subtask.status === 'DONE' ? 'TODO' : 'DONE'
                              } as Partial<Task>);
                            }}
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              subtask.status === 'DONE'
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 hover:border-blue-400"
                            )}
                          >
                            {subtask.status === 'DONE' && <Check className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              subtask.status === 'DONE' && "line-through text-gray-400"
                            )}>
                              {subtask.title}
                            </p>
                          </div>
                          <Badge className={cn("text-xs", subtaskPriority.bgColor, subtaskPriority.color)}>
                            {subtaskPriority.label}
                          </Badge>
                          <span className={cn("text-xs", subtaskStatus.color)}>
                            {subtaskStatus.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : !isAddingSubtask ? (
                  <div className="text-center py-8">
                    <ListChecks className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">{t('tasks.noSubtasks')}</p>
                  </div>
                ) : null}

                {/* Add Subtask Form */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder={t('tasks.taskTitle')}
                      className="flex-1 bg-transparent text-sm border-none outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                          createSubtaskMutation.mutate(newSubtaskTitle.trim());
                        }
                        if (e.key === 'Escape') {
                          setIsAddingSubtask(false);
                          setNewSubtaskTitle('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newSubtaskTitle.trim()) {
                          createSubtaskMutation.mutate(newSubtaskTitle.trim());
                        }
                      }}
                      disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {createSubtaskMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingSubtask(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {t('tasks.addSubtask')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Activity & Comments */}
        <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('tasks.activity')}</h2>
            <span className="text-xs text-gray-400">
              {comments.length} {t('tasks.fields.comments').toLowerCase()}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Activity History */}
            <div className="space-y-3 mb-6">
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
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('tasks.fields.comments')}
              </h3>

              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t('tasks.noComments')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="group">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={comment.author?.avatar} />
                          <AvatarFallback className="text-xs bg-blue-500 text-white">
                            {comment.author?.name?.charAt(0) || comment.author?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.author?.name || comment.author?.email}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-1">
                            <button
                              onClick={() => {
                                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                setReplyText('');
                              }}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Reply className="h-3 w-3" />
                              {t('comments.reply')}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(t('common.delete') + '?')) {
                                  deleteCommentMutation.mutate(comment.id);
                                }
                              }}
                              className="text-xs text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {t('common.delete')}
                            </button>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t('comments.writeComment')}
                                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && replyText.trim()) {
                                    handleSendReply(comment.id);
                                  }
                                  if (e.key === 'Escape') {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSendReply(comment.id)}
                                disabled={!replyText.trim() || createCommentMutation.isPending}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                {createCommentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2 group/reply">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={reply.author?.avatar} />
                                    <AvatarFallback className="text-xs bg-gray-400 text-white">
                                      {reply.author?.name?.charAt(0) || reply.author?.email?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-xs text-gray-900">
                                          {reply.author?.name || reply.author?.email}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (confirm(t('common.delete') + '?')) {
                                          deleteCommentMutation.mutate(reply.id);
                                        }
                                      }}
                                      className="text-xs text-gray-400 hover:text-red-600 ml-1 mt-0.5 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                    >
                                      {t('common.delete')}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('tasks.writeComment')}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                />
                <div className="flex items-center justify-end mt-2">
                  <Button
                    size="sm"
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                    onClick={handleSendComment}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {createCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    {t('common.send')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('tasks.editTask')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('tasks.fields.title')}</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t('tasks.fields.title')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('tasks.fields.description')}</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t('tasks.fields.description')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(previewFile.mimeType)}
              {previewFile?.originalName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {previewFile?.mimeType.startsWith('image/') ? (
              <img
                src={api.files.getDownloadUrl(previewFile.id)}
                alt={previewFile.originalName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : previewFile?.mimeType === 'application/pdf' ? (
              <iframe
                src={api.files.getDownloadUrl(previewFile.id)}
                className="w-full h-[60vh] rounded-lg border"
                title={previewFile.originalName}
              />
            ) : (
              <div className="text-center py-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                  {previewFile && getFileIcon(previewFile.mimeType)}
                </div>
                <p className="text-gray-500 mb-2">{t('files.preview')}</p>
                <p className="text-sm text-gray-400">
                  {previewFile && formatFileSize(previewFile.size)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => previewFile && handleDownloadFile(previewFile)}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
