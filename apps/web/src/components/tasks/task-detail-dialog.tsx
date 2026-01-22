'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  MessageSquare,
  Send,
  Plus,
  ListTodo,
  ChevronDown,
  ChevronRight,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useTaskComments, useCreateComment } from '@/hooks/use-comments';
import { useUpdateTask, useCreateTask } from '@/hooks/use-tasks';
import { toast } from 'sonner';
import type { Task as TaskType } from '@/types';
import { api } from '@/lib/api';

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
  project?: { id: string; name: string; color?: string };
  assignee?: User;
  assigneeId?: string;
  subtasks?: Task[];
  files?: Array<{ id: string; name: string; originalName: string; url: string; mimeType: string; size: number }>;
  _count?: { subtasks: number; comments: number; files?: number };
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
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
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: taskComments, isLoading: commentsLoading, refetch: refetchComments } = useTaskComments(task?.id || '');
  const createCommentMutation = useCreateComment();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();

  const comments = (taskComments as Comment[]) || [];

  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const handleUpdateTask = (updates: Partial<TaskType>) => {
    if (!task) return;
    updateTaskMutation.mutate(
      { id: task.id, data: updates },
      {
        onSuccess: () => {
          toast.success('Task updated');
        },
      }
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;

    setIsUploading(true);
    try {
      // Upload files if any
      for (const file of attachedFiles) {
        try {
          await api.files.upload(file, { taskId: task.id });
        } catch (error) {
          console.error('File upload failed:', error);
        }
      }

      createCommentMutation.mutate(
        { content: newComment, taskId: task.id },
        {
          onSuccess: () => {
            toast.success('Comment added');
            setNewComment('');
            setAttachedFiles([]);
            refetchComments();
          },
          onError: () => {
            toast.error('Failed to add comment');
          },
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !task) return;

    createTaskMutation.mutate(
      {
        title: newSubtaskTitle,
        parentId: task.id,
        projectId: task.project?.id,
        status: 'TODO',
        priority: 'MEDIUM',
      } as Partial<TaskType>,
      {
        onSuccess: () => {
          toast.success('Subtask added');
          setNewSubtaskTitle('');
        },
        onError: () => {
          toast.error('Failed to add subtask');
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

  if (!task) return null;

  const currentStatus = columns.find(c => c.id === task.status);
  const currentPriority = priorities.find(p => p.id === task.priority);

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={cn('w-3 h-3 rounded-full', currentStatus?.color)} />
            <span className="text-lg font-semibold">{task.title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            {task.createdAt && (
              <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>

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
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('subtasks')}
                  className={cn(
                    'pb-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'subtasks'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-white/50 hover:text-white'
                  )}
                >
                  Subtasks
                  {(task._count?.subtasks || 0) > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-white/10 text-xs">
                      {task._count?.subtasks}
                    </Badge>
                  )}
                </button>
              </div>

              {activeTab === 'details' && (
                <>
                  {/* Status & Assignee Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Status</span>
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(value) => {
                          handleUpdateTask({ status: value as TaskType['status'] });
                          onUpdate({ ...task, status: value });
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', currentStatus?.textColor)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              <span className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', col.color)} />
                                {col.name}
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
                        <span>Assignees</span>
                      </div>
                      <Select
                        value={task.assigneeId || '__none__'}
                        onValueChange={(value) => {
                          const actualValue = value === '__none__' ? null : value;
                          handleUpdateTask({ assigneeId: actualValue } as Partial<TaskType>);
                          const user = actualValue ? users.find(u => u.id === actualValue) : undefined;
                          onUpdate({
                            ...task,
                            assigneeId: actualValue || undefined,
                            assignee: user,
                          });
                        }}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-white/50">Unassigned</span>
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

                  {/* Dates & Priority Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        <span>Dates</span>
                      </div>
                      <div className="text-sm">
                        {task.dueDate ? (
                          <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        ) : (
                          <span className="text-white/40">No due date</span>
                        )}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Flag className="h-3 w-3" />
                        <span>Priority</span>
                      </div>
                      <Select
                        value={task.priority}
                        onValueChange={(value) => {
                          handleUpdateTask({ priority: value as TaskType['priority'] });
                          onUpdate({ ...task, priority: value });
                        }}
                      >
                        <SelectTrigger className={cn('h-9 w-full', currentPriority?.color)}>
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
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-white/50 text-xs">Description</Label>
                    <div className="min-h-[100px] p-3 rounded-lg bg-white/5 border border-white/10">
                      {task.description ? (
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {parseLinks(task.description)}
                        </p>
                      ) : (
                        <p className="text-sm text-white/30 italic">No description</p>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/50 text-xs">Attachments</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-white/50 hover:text-white text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div
                      className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-white/30" />
                      <p className="text-sm text-white/50">Drop your files here to <span className="text-blue-400">upload</span></p>
                    </div>

                    {task.files && task.files.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {task.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            {isImageFile(file.mimeType) ? (
                              <ImageIcon className="h-4 w-4 text-green-400" />
                            ) : (
                              <File className="h-4 w-4 text-blue-400" />
                            )}
                            <span className="text-sm truncate flex-1">{file.originalName}</span>
                            <span className="text-xs text-white/40">{formatFileSize(file.size)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'subtasks' && (
                <div className="space-y-3">
                  {task.subtasks?.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Checkbox
                        checked={subtask.status === 'DONE'}
                        onCheckedChange={(checked) => {
                          updateTaskMutation.mutate({
                            id: subtask.id,
                            data: { status: checked ? 'DONE' : 'TODO' } as Partial<TaskType>,
                          });
                        }}
                      />
                      <span className={cn('text-sm flex-1', subtask.status === 'DONE' && 'line-through text-white/50')}>
                        {subtask.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {columns.find(c => c.id === subtask.status)?.name}
                      </Badge>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Add subtask..."
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
                <span className="font-medium text-sm">Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-xs">
                  {comments.length}
                </Badge>
              </div>
            </div>

            {/* Activity Feed */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Activity items (task created, assigned, etc.) */}
                <div className="flex items-start gap-3 text-xs text-white/50">
                  <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5" />
                  <div>
                    <span>You created this task</span>
                    {task.createdAt && (
                      <span className="ml-2">{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>

                {task.assigneeId && (
                  <div className="flex items-start gap-3 text-xs text-white/50">
                    <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5" />
                    <div>
                      <span>Assigned to: {getUserById(task.assigneeId)?.name || 'User'}</span>
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
                    const author = getUserById(comment.authorId);
                    return (
                      <div key={comment.id} className="bg-white/5 rounded-lg p-4 space-y-3">
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
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400">Delete</DropdownMenuItem>
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
                          <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-4 border-t border-white/10 space-y-3">
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
                placeholder="Mention @Brain to create, find, ask anything"
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
