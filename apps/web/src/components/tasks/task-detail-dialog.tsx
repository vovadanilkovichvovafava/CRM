'use client';

import { useState, useRef } from 'react';
import {
  CalendarDays,
  MessageSquare,
  Send,
  Plus,
  ListTodo,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Image,
  File,
  X,
  Download,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  { id: 'TODO', name: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', name: 'In Review', color: 'bg-yellow-500' },
  { id: 'DONE', name: 'Done', color: 'bg-green-500' },
];

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-gray-500',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function TaskDetailDialog({ task, users, onClose, onUpdate }: TaskDetailDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // First upload files if any
      const uploadedFileIds: string[] = [];
      for (const file of attachedFiles) {
        try {
          const result = await api.files.upload(file, { taskId: task.id });
          if (result?.id) {
            uploadedFileIds.push(result.id);
          }
        } catch (error) {
          console.error('File upload failed:', error);
        }
      }

      // Then create comment
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

  if (!task) return null;

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={cn('w-3 h-3 rounded-full', columns.find(c => c.id === task.status)?.color)} />
            <span className="text-xl">{task.title}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <p className="text-sm text-white/70 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-3">
              <Badge className={cn('text-white', priorityColors[task.priority])}>
                {task.priority}
              </Badge>
              <Badge variant="outline">
                {columns.find(c => c.id === task.status)?.name}
              </Badge>
              {task.project && (
                <Badge variant="outline" className="gap-1">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: task.project.color || '#6366f1' }}
                  />
                  {task.project.name}
                </Badge>
              )}
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">Status</Label>
                <Select
                  value={task.status}
                  onValueChange={(value) => {
                    handleUpdateTask({ status: value as TaskType['status'] });
                    onUpdate({ ...task, status: value });
                  }}
                >
                  <SelectTrigger className="h-9">
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
                <Label className="text-white/50 text-xs">Assignee</Label>
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
                  <SelectTrigger className="h-9">
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

              {/* Due Date */}
              {task.dueDate && (
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Due Date</Label>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(task.dueDate), 'PPP')}
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-2 mb-3 text-sm font-medium hover:text-white/80 transition-colors"
              >
                {showSubtasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <ListTodo className="h-4 w-4 text-white/60" />
                Subtasks
                <Badge variant="secondary" className="bg-white/10 ml-1">
                  {task._count?.subtasks || task.subtasks?.length || 0}
                </Badge>
              </button>

              {showSubtasks && (
                <div className="space-y-2 ml-6">
                  {task.subtasks?.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                      <Checkbox
                        checked={subtask.status === 'DONE'}
                        onCheckedChange={(checked) => {
                          updateTaskMutation.mutate({
                            id: subtask.id,
                            data: { status: checked ? 'DONE' : 'TODO' } as Partial<TaskType>,
                          });
                        }}
                      />
                      <span className={cn('text-sm', subtask.status === 'DONE' && 'line-through text-white/50')}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}

                  {/* Add subtask input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtask();
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskTitle.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-white/60" />
                <h3 className="font-medium text-sm">Comments & Discussion</h3>
                <Badge variant="secondary" className="bg-white/10">
                  {task._count?.comments || comments.length}
                </Badge>
              </div>

              {/* Comments List */}
              <div className="space-y-4 mb-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-white/40 bg-white/5 rounded-lg">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to comment</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const author = getUserById(comment.authorId);
                    return (
                      <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-white/5">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={author?.avatar} />
                          <AvatarFallback className="text-xs bg-indigo-500">
                            {author?.name?.charAt(0) || author?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {author?.name || author?.email || 'Unknown User'}
                            </span>
                            <span className="text-xs text-white/40">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>

                          {/* Comment attachments */}
                          {comment.files && comment.files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {comment.files.map((file) => (
                                <div key={file.id}>
                                  {isImageFile(file.mimeType) ? (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                                    >
                                      <img
                                        src={file.url}
                                        alt={file.originalName}
                                        className="max-w-[200px] max-h-[150px] object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 rounded bg-white/10 hover:bg-white/15 transition-colors text-xs"
                                    >
                                      <File className="h-4 w-4 text-white/60" />
                                      <span className="truncate max-w-[150px]">{file.originalName}</span>
                                      <Download className="h-3 w-3 text-white/40" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <div className="space-y-3 bg-white/5 rounded-lg p-4">
                <Textarea
                  placeholder="Write a comment... Share updates, ask questions, or provide feedback"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none bg-transparent border-white/10 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />

                {/* Attached files preview */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 text-xs"
                      >
                        {file.type.startsWith('image/') ? (
                          <Image className="h-3 w-3 text-green-400" />
                        ) : (
                          <File className="h-3 w-3 text-blue-400" />
                        )}
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <span className="text-white/40">{formatFileSize(file.size)}</span>
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

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white/60 hover:text-white"
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = 'image/*';
                          fileInputRef.current.click();
                          fileInputRef.current.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt';
                        }
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Image
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">⌘+Enter to send</span>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || createCommentMutation.isPending || isUploading}
                      size="sm"
                    >
                      {isUploading || createCommentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Files Section */}
            {task.files && task.files.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-white/60" />
                  <h3 className="font-medium text-sm">Attachments</h3>
                  <Badge variant="secondary" className="bg-white/10">
                    {task.files.length}
                  </Badge>
                </div>

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
                        <Image className="h-4 w-4 text-green-400" />
                      ) : (
                        <File className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="text-sm truncate flex-1">{file.originalName}</span>
                      <span className="text-xs text-white/40">{formatFileSize(file.size)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
