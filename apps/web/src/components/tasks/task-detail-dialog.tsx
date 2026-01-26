'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Send,
  Plus,
  ListTodo,
  ChevronLeft,
  Paperclip,
  Image as ImageIcon,
  File,
  X,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Clock,
  User,
  Flag,
  Activity,
  Upload,
  AtSign,
  Link2,
  Trash2,
  Pencil,
  Check,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTaskComments, useCreateComment } from '@/hooks/use-comments';
import { useUpdateTask, useCreateTask, useTask, useDeleteTask } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { toast } from 'sonner';
import type { Task as TaskType } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { SubtaskCard } from './subtask-card';

/**
 * Task role for permission checks
 * project_owner has the same permissions as creator
 */
type TaskRole = 'creator' | 'project_owner' | 'assignee' | 'viewer';

/**
 * Get user role for a task
 * Includes check for project owner (createdBy of the project)
 */
function getUserRole(task: Task, userId: string | undefined): TaskRole {
  if (!userId) return 'viewer';
  if (task.createdBy === userId) return 'creator';
  // Project owner has the same permissions as task creator
  if (task.project?.createdBy === userId) return 'project_owner';
  if (task.assigneeId === userId) return 'assignee';
  return 'viewer';
}

/**
 * Check if all subtasks are done
 */
function areAllSubtasksDone(subtasks: Task[] | undefined): boolean {
  if (!subtasks || subtasks.length === 0) return true;
  return subtasks.every((st) => st.status === 'DONE');
}

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  startDate?: string;
  createdAt?: string;
  createdBy: string;
  project?: { id: string; name: string; color?: string; createdBy?: string };
  assignee?: User;
  assigneeId?: string;
  subtasks?: Task[];
  files?: Array<{ id: string; name: string; originalName: string; url: string; mimeType: string; size: number }>;
  _count?: { subtasks: number; comments: number; files?: number };
}

interface CommentAuthor {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  parentId?: string;
  author?: CommentAuthor;
  replies?: Comment[];
  createdAt: string;
  files?: Array<{ id: string; name: string; originalName: string; url: string; mimeType: string; size: number }>;
}

interface TaskDetailDialogProps {
  task: Task | null;
  users: User[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

const columns = [
  { id: 'TODO', name: 'To Do', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { id: 'IN_REVIEW', name: 'In Review', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { id: 'DONE', name: 'Done', color: 'bg-green-500', textColor: 'text-green-400' },
];

const priorities = [
  { id: 'URGENT', name: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500' },
  { id: 'HIGH', name: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  { id: 'MEDIUM', name: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
  { id: 'LOW', name: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-500' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Parse @mentions from text
function parseContent(content: string, users: User[]): React.ReactNode {
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add mention as styled element
    const mentionName = match[1];
    const user = users.find(u =>
      u.name?.toLowerCase().includes(mentionName.toLowerCase()) ||
      u.email?.toLowerCase().includes(mentionName.toLowerCase())
    );

    parts.push(
      <span key={match.index} className="text-blue-400 font-medium hover:underline cursor-pointer">
        @{user?.name || mentionName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Check if URL is a link (for auto-linking)
function parseLinks(content: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function TaskDetailDialog({ task, users, onClose, onUpdate }: TaskDetailDialogProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  // Description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  // Navigation state for viewing subtasks
  const [taskHistory, setTaskHistory] = useState<string[]>([]);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  // File upload states
  const [isUploadingTaskFile, setIsUploadingTaskFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch full task data to get subtasks
  const { data: fullTaskData, refetch: refetchTask } = useTask(task?.id || '');
  // Fetch the subtask data when viewing a subtask
  const { data: viewingSubtaskData, refetch: refetchViewingTask } = useTask(viewingTaskId || '');
  const deleteTaskMutation = useDeleteTask();
  // Fetch projects for project selector
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data || [];

  // Reset navigation and editing state when dialog closes or task changes
  useEffect(() => {
    if (!task) {
      setViewingTaskId(null);
      setTaskHistory([]);
      setIsEditingDescription(false);
      setIsEditingTitle(false);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  // Reset editing state when switching between tasks/subtasks
  useEffect(() => {
    setIsEditingDescription(false);
    setIsEditingTitle(false);
  }, [viewingTaskId]);

  // Determine which task to display
  const displayTask = viewingTaskId && viewingSubtaskData ? viewingSubtaskData : (fullTaskData || task);
  const isViewingSubtask = !!viewingTaskId;

  // Navigate to a subtask
  const navigateToSubtask = (subtask: Task) => {
    if (displayTask) {
      setTaskHistory(prev => [...prev, displayTask.id]);
    }
    setViewingTaskId(subtask.id);
    setActiveTab('details');
  };

  // Navigate back to parent
  const navigateBack = () => {
    const newHistory = [...taskHistory];
    const previousTaskId = newHistory.pop();
    setTaskHistory(newHistory);
    setViewingTaskId(previousTaskId === task?.id ? null : previousTaskId || null);
  };

  // Get current user for permission checks
  const currentUser = useAuthStore((state) => state.user);
  const userRole = displayTask ? getUserRole(displayTask as Task, currentUser?.id) : 'viewer';
  // Creator and project owner have full permissions
  const isCreator = userRole === 'creator' || userRole === 'project_owner';
  const isAssignee = userRole === 'assignee';
  // Only creator/project_owner can change status - assignee has view-only access to status
  const canEditStatus = isCreator;
  const canEditAllFields = isCreator;
  const canAddAttachments = isCreator || isAssignee;
  // Can delete files: creator, project owner, or the one who uploaded
  const canDeleteFiles = isCreator || isAssignee;
  // Use fullTaskData subtasks if available for accurate status check
  const subtasksForCheck = displayTask?.subtasks;
  const hasIncompleteSubtasks = displayTask ? !areAllSubtasksDone(subtasksForCheck as Task[] | undefined) : false;

  const { data: taskComments, isLoading: commentsLoading, refetch: refetchComments } = useTaskComments(displayTask?.id || '');
  const createCommentMutation = useCreateComment();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();

  // Merge task data with full data (subtasks from fullTaskData)
  const taskWithSubtasks = {
    ...displayTask,
    subtasks: displayTask?.subtasks || [],
  };

  const comments = (taskComments as Comment[]) || [];

  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const handleUpdateTask = (updates: Partial<TaskType>) => {
    if (!displayTask) return;

    // Check if trying to set status to DONE with incomplete subtasks
    if (updates.status === 'DONE' && hasIncompleteSubtasks) {
      toast.error(t('tasks.messages.completeSubtasksFirst') || 'Cannot mark task as DONE. Complete all subtasks first.');
      return;
    }

    updateTaskMutation.mutate(
      { id: displayTask.id, data: updates },
      {
        onSuccess: () => {
          toast.success(t('tasks.messages.updated'));
          // Refresh the current task data
          if (viewingTaskId) {
            refetchViewingTask();
          } else {
            refetchTask();
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || t('errors.general'));
        },
      }
    );
  };

  const handleSaveTitle = () => {
    if (!titleDraft.trim() || !displayTask) return;

    handleUpdateTask({ title: titleDraft.trim() });
    if (!isViewingSubtask) {
      onUpdate({ ...task!, title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDeleteTask = () => {
    if (!displayTask) return;

    deleteTaskMutation.mutate(displayTask.id, {
      onSuccess: () => {
        toast.success(t('tasks.messages.deleted'));
        setShowDeleteConfirm(false);
        if (isViewingSubtask) {
          // Navigate back to parent task
          navigateBack();
          refetchTask();
        } else {
          // Close the dialog
          onClose();
        }
      },
      onError: () => {
        toast.error(t('errors.general'));
      },
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !displayTask) return;

    setIsUploading(true);
    try {
      // Upload files if any
      for (const file of attachedFiles) {
        try {
          await api.files.upload(file, { taskId: displayTask.id });
        } catch (error) {
          console.error('File upload failed:', error);
        }
      }

      createCommentMutation.mutate(
        {
          content: newComment,
          taskId: displayTask.id,
          parentId: replyingTo?.id,
        },
        {
          onSuccess: () => {
            toast.success(t('comments.addComment'));
            setNewComment('');
            setAttachedFiles([]);
            setReplyingTo(null);
            refetchComments();
          },
          onError: () => {
            toast.error(t('errors.general'));
          },
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleReply = (comment: Comment) => {
    const authorName = comment.author?.name || comment.author?.email || getUserById(comment.authorId)?.name || 'User';
    setReplyingTo({ id: comment.id, authorName });
    commentInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !displayTask) return;

    createTaskMutation.mutate(
      {
        title: newSubtaskTitle,
        parentId: displayTask.id,
        projectId: displayTask.project?.id,
        status: 'TODO',
        priority: 'MEDIUM',
      } as Partial<TaskType>,
      {
        onSuccess: () => {
          toast.success(t('tasks.messages.created'));
          setNewSubtaskTitle('');
          // Refresh the current task data
          if (viewingTaskId) {
            refetchViewingTask();
          } else {
            refetchTask();
          }
        },
        onError: () => {
          toast.error(t('errors.general'));
        },
      }
    );
  };

  // Handle subtask deletion
  const handleDeleteSubtask = (subtaskId: string) => {
    deleteTaskMutation.mutate(subtaskId, {
      onSuccess: () => {
        toast.success(t('tasks.messages.deleted'));
        if (viewingTaskId) {
          refetchViewingTask();
        } else {
          refetchTask();
        }
      },
      onError: () => {
        toast.error(t('errors.general'));
      },
    });
  };

  // Handle subtask status change
  const handleSubtaskStatusChange = (subtaskId: string, done: boolean) => {
    updateTaskMutation.mutate(
      {
        id: subtaskId,
        data: { status: done ? 'DONE' : 'TODO' } as Partial<TaskType>,
      },
      {
        onSuccess: () => {
          if (viewingTaskId) {
            refetchViewingTask();
          } else {
            refetchTask();
          }
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle task file upload (direct upload to task, not via comment)
  const handleTaskFileUpload = async (files: FileList | File[]) => {
    if (!displayTask || files.length === 0) return;

    setIsUploadingTaskFile(true);
    try {
      for (const file of Array.from(files)) {
        await api.files.upload(file, { taskId: displayTask.id });
      }
      toast.success(t('files.uploadFile'));
      // Refresh task data to show new files
      if (viewingTaskId) {
        refetchViewingTask();
      } else {
        refetchTask();
      }
    } catch (error) {
      toast.error(t('errors.general'));
    } finally {
      setIsUploadingTaskFile(false);
    }
  };

  const handleTaskFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleTaskFileUpload(e.target.files);
    }
    if (taskFileInputRef.current) {
      taskFileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && canAddAttachments) {
      handleTaskFileUpload(e.dataTransfer.files);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletingFileId(fileId);
    try {
      await api.files.delete(fileId);
      toast.success(t('files.delete'));
      // Refresh task data
      if (viewingTaskId) {
        refetchViewingTask();
      } else {
        refetchTask();
      }
    } catch (error) {
      toast.error(t('errors.general'));
    } finally {
      setDeletingFileId(null);
    }
  };

  const insertMention = (user: User) => {
    const mention = `@${user.name || user.email} `;
    setNewComment(prev => prev + mention);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  // Handle @ key for mentions
  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true);
      setMentionFilter('');
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const filteredUsers = users.filter(u =>
    !mentionFilter ||
    u.name?.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  if (!task || !displayTask) return null;

  const currentStatus = columns.find(c => c.id === displayTask.status);
  const currentPriority = priorities.find(p => p.id === displayTask.priority);

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button when viewing subtask */}
            {isViewingSubtask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateBack}
                className="h-8 w-8 mr-1 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className={cn('w-3 h-3 rounded-full flex-shrink-0', currentStatus?.color)} />
            <div className="flex flex-col flex-1 min-w-0">
              {/* Breadcrumb showing parent task when viewing subtask */}
              {isViewingSubtask && task && (
                <button
                  onClick={navigateBack}
                  className="text-xs text-white/40 hover:text-white/60 text-left truncate max-w-[300px]"
                >
                  {task.title}
                </button>
              )}
              {/* Editable title */}
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="h-8 text-lg font-semibold bg-white/5 border-white/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={handleSaveTitle}
                  >
                    <Check className="h-4 w-4 text-green-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    <X className="h-4 w-4 text-white/50" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <span className="text-lg font-semibold truncate">{displayTask.title}</span>
                  {canEditAllFields && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => {
                        setTitleDraft(displayTask.title);
                        setIsEditingTitle(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 text-white/50" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {/* Subtask badge */}
            {isViewingSubtask && (
              <Badge variant="outline" className="text-[10px] text-white/50 flex-shrink-0">
                Subtask
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-white/50">
              {displayTask.createdAt && `Created ${format(new Date(displayTask.createdAt), 'MMM d, yyyy')}`}
            </span>
            {/* Task actions dropdown */}
            {canEditAllFields && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setTitleDraft(displayTask.title);
                      setIsEditingTitle(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Close button */}
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('tasks.deleteTask')}?</AlertDialogTitle>
              <AlertDialogDescription>
                {displayTask.title}
                {!isViewingSubtask && taskWithSubtasks.subtasks && taskWithSubtasks.subtasks.length > 0 && (
                  <span className="block mt-2 text-yellow-400">
                    {t('tasks.fields.subtasks')}: {taskWithSubtasks.subtasks.length}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTask}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteTaskMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                ) : (
                  t('common.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Task Details */}
          <div className="flex-1 overflow-y-auto border-r border-white/10">
            <div className="p-6 space-y-6">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'pb-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'details'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-white/50 hover:text-white'
                  )}
                >
                  {t('common.details')}
                </button>
                {/* Hide subtasks tab for subtasks - subtasks cannot have nested subtasks */}
                {!isViewingSubtask && (
                  <button
                    onClick={() => setActiveTab('subtasks')}
                    className={cn(
                      'pb-2 text-sm font-medium border-b-2 transition-colors',
                      activeTab === 'subtasks'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-white/50 hover:text-white'
                    )}
                  >
                    {t('tasks.fields.subtasks')}
                    {((displayTask._count?.subtasks || 0) > 0 || (taskWithSubtasks.subtasks?.length || 0) > 0) && (
                      <Badge variant="secondary" className="ml-2 bg-white/10 text-xs">
                        {displayTask._count?.subtasks || taskWithSubtasks.subtasks?.length || 0}
                      </Badge>
                    )}
                  </button>
                )}
              </div>

              {activeTab === 'details' && (
                <>
                  {/* Status & Assignee Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{t('tasks.fields.status')}</span>
                        {!canEditStatus && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{t('common.view')}</Badge>
                        )}
                      </div>
                      <Select
                        value={displayTask.status}
                        disabled={!canEditStatus}
                        onValueChange={(value) => {
                          handleUpdateTask({ status: value as TaskType['status'] });
                          if (!isViewingSubtask) {
                            onUpdate({ ...task, status: value });
                          }
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', currentStatus?.textColor, !canEditStatus && 'opacity-60')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem
                              key={col.id}
                              value={col.id}
                              disabled={col.id === 'DONE' && hasIncompleteSubtasks}
                            >
                              <span className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', col.color)} />
                                {col.name}
                                {col.id === 'DONE' && hasIncompleteSubtasks && (
                                  <span className="text-[10px] text-white/40">(subtasks pending)</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <User className="h-3 w-3" />
                        <span>{t('tasks.fields.assignee')}</span>
                        {!canEditAllFields && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{t('common.view')}</Badge>
                        )}
                      </div>
                      <Select
                        value={displayTask.assigneeId || '__none__'}
                        disabled={!canEditAllFields}
                        onValueChange={(value) => {
                          const actualValue = value === '__none__' ? null : value;
                          handleUpdateTask({ assigneeId: actualValue } as Partial<TaskType>);
                          const user = actualValue ? users.find(u => u.id === actualValue) : undefined;
                          if (!isViewingSubtask) {
                            onUpdate({
                              ...task,
                              assigneeId: actualValue || undefined,
                              assignee: user,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', !canEditAllFields && 'opacity-60')}>
                          <SelectValue placeholder={t('common.unassigned')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-white/50">{t('common.unassigned')}</span>
                          </SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <span className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="text-[9px] bg-indigo-500">
                                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                {user.name || user.email || 'User'}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Project & Dates Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Project */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Folder className="h-3 w-3" />
                        <span>{t('tasks.fields.project')}</span>
                        {!canEditAllFields && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{t('common.view')}</Badge>
                        )}
                      </div>
                      <Select
                        value={displayTask.project?.id || '__none__'}
                        disabled={!canEditAllFields}
                        onValueChange={(value) => {
                          const actualValue = value === '__none__' ? null : value;
                          handleUpdateTask({ projectId: actualValue } as Partial<TaskType>);
                          const project = actualValue ? projects.find(p => p.id === actualValue) : undefined;
                          if (!isViewingSubtask) {
                            onUpdate({
                              ...task,
                              project: project ? { id: project.id, name: project.name, color: project.color } : undefined,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', !canEditAllFields && 'opacity-60')}>
                          <SelectValue placeholder={t('common.none')}>
                            {displayTask.project ? (
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: displayTask.project.color || '#6366f1' }}
                                />
                                {displayTask.project.name}
                              </span>
                            ) : (
                              <span className="text-white/50">{t('common.none')}</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-white/50">{t('common.none')}</span>
                          </SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: project.color || '#6366f1' }}
                                />
                                {project.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        <span>{t('tasks.fields.dueDate')}</span>
                      </div>
                      <div className="text-sm">
                        {displayTask.dueDate ? (
                          <span>{t('common.due')} {format(new Date(displayTask.dueDate), 'MMM d, yyyy')}</span>
                        ) : (
                          <span className="text-white/40">{t('common.none')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Flag className="h-3 w-3" />
                        <span>{t('tasks.fields.priority')}</span>
                        {!canEditAllFields && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{t('common.view')}</Badge>
                        )}
                      </div>
                      <Select
                        value={displayTask.priority}
                        disabled={!canEditAllFields}
                        onValueChange={(value) => {
                          handleUpdateTask({ priority: value as TaskType['priority'] });
                          if (!isViewingSubtask) {
                            onUpdate({ ...task, priority: value });
                          }
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', currentPriority?.color, !canEditAllFields && 'opacity-60')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className={cn('flex items-center gap-2', p.color)}>
                                <Flag className="h-3 w-3" />
                                {p.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div /> {/* Empty cell for grid alignment */}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/50 text-xs">{t('tasks.fields.description')}</Label>
                      {canEditAllFields && !isEditingDescription && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDescriptionDraft(displayTask.description || '');
                            setIsEditingDescription(true);
                          }}
                          className="text-white/50 hover:text-white text-xs h-6"
                        >
                          {t('common.edit')}
                        </Button>
                      )}
                    </div>
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          placeholder={t('tasks.fields.description') + '...'}
                          rows={4}
                          className="bg-white/5 border-white/10 text-sm resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDescription(false)}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              handleUpdateTask({ description: descriptionDraft });
                              setIsEditingDescription(false);
                            }}
                          >
                            {t('common.save')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'min-h-[100px] p-3 rounded-lg bg-white/5 border border-white/10',
                          canEditAllFields && 'cursor-pointer hover:bg-white/10 transition-colors'
                        )}
                        onClick={() => {
                          if (canEditAllFields) {
                            setDescriptionDraft(displayTask.description || '');
                            setIsEditingDescription(true);
                          }
                        }}
                      >
                        {displayTask.description ? (
                          <p className="text-sm text-white/80 whitespace-pre-wrap">
                            {parseLinks(displayTask.description)}
                          </p>
                        ) : (
                          <p className="text-sm text-white/30 italic">
                            {canEditAllFields ? t('common.add') + '...' : t('projects.noDescription')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/50 text-xs">
                        {t('tasks.fields.files')}
                        {displayTask.files && displayTask.files.length > 0 && (
                          <span className="ml-1 text-white/30">({displayTask.files.length})</span>
                        )}
                      </Label>
                      {canAddAttachments && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => taskFileInputRef.current?.click()}
                          className="text-white/50 hover:text-white text-xs"
                          disabled={isUploadingTaskFile}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('common.add')}
                        </Button>
                      )}
                    </div>

                    {/* Hidden file input for task files */}
                    <input
                      type="file"
                      ref={taskFileInputRef}
                      onChange={handleTaskFileSelect}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />

                    {/* Show files if available, otherwise show drop zone */}
                    {displayTask.files && displayTask.files.length > 0 ? (
                      <div
                        className={cn(
                          'grid grid-cols-2 gap-2 p-3 rounded-lg border-2 border-dashed transition-colors',
                          isDragging && canAddAttachments
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-transparent'
                        )}
                        onDragOver={canAddAttachments ? handleDragOver : undefined}
                        onDragLeave={canAddAttachments ? handleDragLeave : undefined}
                        onDrop={canAddAttachments ? handleDrop : undefined}
                      >
                        {displayTask.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors group"
                          >
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 flex-1 min-w-0"
                            >
                              {isImageFile(file.mimeType) ? (
                                <ImageIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                              ) : (
                                <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate flex-1">{file.originalName}</span>
                              <span className="text-xs text-white/40 flex-shrink-0">{formatFileSize(file.size)}</span>
                            </a>
                            {canDeleteFiles && (
                              <button
                                onClick={(e) => handleDeleteFile(file.id, e)}
                                disabled={deletingFileId === file.id}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all flex-shrink-0"
                                title="Delete file"
                              >
                                {deletingFileId === file.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-400" />
                                ) : (
                                  <X className="h-3 w-3 text-red-400" />
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                        {isUploadingTaskFile && (
                          <div className="flex items-center gap-2 p-2 rounded bg-white/5">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500" />
                            <span className="text-sm text-white/50">{t('common.loading')}</span>
                          </div>
                        )}
                      </div>
                    ) : canAddAttachments ? (
                      <div
                        className={cn(
                          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                          isDragging
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/10 hover:border-white/20'
                        )}
                        onClick={() => taskFileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {isUploadingTaskFile ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-2 border-t-2 border-b-2 border-indigo-500" />
                            <p className="text-sm text-white/50">{t('common.loading')}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-white/30" />
                            <p className="text-sm text-white/50">
                              {t('files.dropHere')} <span className="text-blue-400">{t('common.upload')}</span>
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center opacity-50">
                        <p className="text-sm text-white/40">{t('files.noFiles')}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'subtasks' && !isViewingSubtask && (
                <div className="space-y-3">
                  {/* Empty state */}
                  {(!taskWithSubtasks.subtasks || taskWithSubtasks.subtasks.length === 0) && (
                    <div className="text-center py-8 text-white/40">
                      <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('tasks.noTasksYet')}</p>
                      <p className="text-xs mt-1">{t('tasks.actions.addSubtask')}</p>
                    </div>
                  )}

                  {/* Subtasks list using SubtaskCard */}
                  {taskWithSubtasks.subtasks?.map((subtask) => (
                    <SubtaskCard
                      key={subtask.id}
                      subtask={subtask as TaskType}
                      onClick={navigateToSubtask}
                      onStatusChange={handleSubtaskStatusChange}
                      onDelete={canEditAllFields ? handleDeleteSubtask : undefined}
                    />
                  ))}

                  {/* Add subtask input */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <Input
                      placeholder={t('tasks.actions.addSubtask') + '...'}
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtask();
                      }}
                      className="h-9"
                    />
                    <Button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Activity */}
          <div className="w-96 flex flex-col bg-[#0d0d15]">
            {/* Activity Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-white/60" />
                <span className="font-medium text-sm">{t('tasks.fields.activity')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-xs">
                  {comments.length}
                </Badge>
                {/* Show user role */}
                {userRole === 'creator' && (
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 text-[10px]">{t('team.roles.owner')}</Badge>
                )}
                {userRole === 'project_owner' && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-[10px]">{t('team.roles.owner')}</Badge>
                )}
                {isAssignee && !isCreator && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-[10px]">{t('tasks.fields.assignee')}</Badge>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Activity items (task created, assigned, etc.) */}
                <div className="flex items-start gap-3 text-xs text-white/50">
                  <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5" />
                  <div>
                    <span>
                      {getUserById(displayTask.createdBy)?.name || getUserById(displayTask.createdBy)?.email || t('common.unknown')} - {t('activity.types.taskCreated')}
                    </span>
                    {displayTask.createdAt && (
                      <span className="ml-2">{format(new Date(displayTask.createdAt), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>

                {displayTask.assigneeId && (
                  <div className="flex items-start gap-3 text-xs text-white/50">
                    <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5" />
                    <div>
                      <span>{t('tasks.fields.assignee')}: {getUserById(displayTask.assigneeId)?.name || t('common.unknown')}</span>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                  </div>
                ) : (
                  comments.map((comment) => {
                    const author = comment.author || getUserById(comment.authorId);
                    return (
                      <div key={comment.id} className="space-y-2">
                        {/* Main Comment */}
                        <div className="bg-white/5 rounded-lg p-4 space-y-3 group">
                          {/* Comment Header */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={author?.avatar} />
                              <AvatarFallback className="text-xs bg-indigo-500">
                                {author?.name?.charAt(0) || author?.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium text-sm">
                                {author?.name || author?.email || 'Unknown'}
                              </span>
                              <span className="text-xs text-white/40 ml-2">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                              </span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>{t('comments.edit')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400">{t('comments.delete')}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Comment Content */}
                          <div className="text-sm text-white/80 whitespace-pre-wrap pl-11">
                            {parseContent(comment.content, users)}
                          </div>

                          {/* Comment Images */}
                          {comment.files && comment.files.filter(f => isImageFile(f.mimeType)).length > 0 && (
                            <div className="pl-11 space-y-2">
                              {comment.files.filter(f => isImageFile(f.mimeType)).map((file) => (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors max-w-xs"
                                >
                                  <img
                                    src={file.url}
                                    alt={file.originalName}
                                    className="max-w-full h-auto"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 pl-11">
                            <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                              onClick={() => handleReply(comment)}
                            >
                              <Reply className="h-3 w-3" />
                              <span>{t('comments.reply')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-8 space-y-2 border-l-2 border-white/10 pl-4">
                            {comment.replies.map((reply) => {
                              const replyAuthor = reply.author || getUserById(reply.authorId);
                              return (
                                <div key={reply.id} className="bg-white/[0.03] rounded-lg p-3 space-y-2 group">
                                  {/* Reply Header */}
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={replyAuthor?.avatar} />
                                      <AvatarFallback className="text-[10px] bg-indigo-500/70">
                                        {replyAuthor?.name?.charAt(0) || replyAuthor?.email?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <span className="font-medium text-xs">
                                        {replyAuthor?.name || replyAuthor?.email || 'Unknown'}
                                      </span>
                                      <span className="text-[10px] text-white/40 ml-2">
                                        {format(new Date(reply.createdAt), 'MMM d \'at\' h:mm a')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Reply Content */}
                                  <div className="text-xs text-white/70 whitespace-pre-wrap pl-8">
                                    {parseContent(reply.content, users)}
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="flex items-center gap-3 pl-8">
                                    <button className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors">
                                      <ThumbsUp className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
                                      onClick={() => handleReply(comment)}
                                    >
                                      <Reply className="h-2.5 w-2.5" />
                                      <span>{t('comments.reply')}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-4 border-t border-white/10 space-y-3">
              {/* Replying to indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2 text-xs">
                    <Reply className="h-3 w-3 text-indigo-400" />
                    <span className="text-white/60">{t('comments.reply')}</span>
                    <span className="font-medium text-indigo-400">{replyingTo.authorName}</span>
                  </div>
                  <button
                    onClick={cancelReply}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="h-3 w-3 text-white/50" />
                  </button>
                </div>
              )}

              {/* Attached files preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 text-xs"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-3 w-3 text-green-400" />
                      ) : (
                        <File className="h-3 w-3 text-blue-400" />
                      )}
                      <span className="truncate max-w-[80px]">{file.name}</span>
                      <button
                        onClick={() => removeAttachedFile(index)}
                        className="p-0.5 hover:bg-white/10 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Mentions Popover */}
              {showMentions && (
                <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/10 text-left"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[8px] bg-indigo-500">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name || user.email}</span>
                    </button>
                  ))}
                </div>
              )}

              <Textarea
                ref={commentInputRef}
                placeholder={t('comments.writeComment')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                rows={2}
                className="resize-none bg-transparent border-white/10 text-sm"
              />

              {/* Input Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMentions(!showMentions)}>
                    <AtSign className="h-4 w-4 text-white/50" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4 text-white/50" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Link2 className="h-4 w-4 text-white/50" />
                  </Button>
                </div>

                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending || isUploading}
                  size="sm"
                >
                  {isUploading || createCommentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
