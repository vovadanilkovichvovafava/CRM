'use client';

import { useState } from 'react';
import {
  CalendarDays,
  MessageSquare,
  Send,
  Plus,
  Check,
  ListTodo,
  ChevronDown,
  ChevronRight,
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
  checklist?: Array<{ id: string; title: string; isCompleted: boolean }>;
  _count?: { subtasks: number; comments: number };
}

interface Comment {
  id: string;
  content: string;
  author?: User;
  createdAt: string;
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

export function TaskDetailDialog({ task, users, onClose, onUpdate }: TaskDetailDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);

  const { data: taskComments, isLoading: commentsLoading } = useTaskComments(task?.id || '');
  const createCommentMutation = useCreateComment();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();

  const comments = (taskComments as Comment[]) || [];

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

  const handleAddComment = () => {
    if (!newComment.trim() || !task) return;

    createCommentMutation.mutate(
      { content: newComment, taskId: task.id },
      {
        onSuccess: () => {
          toast.success('Comment added');
          setNewComment('');
        },
        onError: () => {
          toast.error('Failed to add comment');
        },
      }
    );
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
                  {/* Existing subtasks would be listed here */}
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

            {/* Checklist Section */}
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center gap-2 mb-3 text-sm font-medium hover:text-white/80 transition-colors"
              >
                {showChecklist ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Check className="h-4 w-4 text-white/60" />
                Checklist
                <Badge variant="secondary" className="bg-white/10 ml-1">
                  {task.checklist?.filter(i => i.isCompleted).length || 0}/{task.checklist?.length || 0}
                </Badge>
              </button>

              {showChecklist && (
                <div className="space-y-2 ml-6">
                  {task.checklist?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={() => {
                          // Would call API to toggle checklist item
                        }}
                      />
                      <span className={cn('text-sm', item.isCompleted && 'line-through text-white/50')}>
                        {item.title}
                      </span>
                    </div>
                  ))}

                  {/* Add checklist item input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Would call API to add checklist item
                          setNewChecklistItem('');
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!newChecklistItem.trim()}
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
                <h3 className="font-medium text-sm">Comments</h3>
                <Badge variant="secondary" className="bg-white/10">
                  {comments.length}
                </Badge>
              </div>

              {/* Comments List */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {commentsLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-16 text-white/40">
                    <p className="text-sm">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-white/5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.author?.avatar} />
                        <AvatarFallback className="text-xs bg-indigo-500">
                          {comment.author?.name?.charAt(0) || comment.author?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author?.name || comment.author?.email || 'Unknown'}
                          </span>
                          <span className="text-xs text-white/40">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-white/40 mt-1">Press Cmd+Enter to send</p>
            </div>
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
