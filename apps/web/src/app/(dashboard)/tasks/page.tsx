'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Calendar, GripVertical, CalendarDays, FolderKanban, User, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks, useCreateTask, useMoveTask, useUpdateTask } from '@/hooks/use-tasks';
import { useUsers, useCurrentUser } from '@/hooks/use-users';
import { useTaskComments, useCreateComment } from '@/hooks/use-comments';
import { cn } from '@/lib/utils';
import type { Task as TaskType } from '@/types';
import { CalendarView, type CalendarEvent } from '@/components/calendar/calendar-view';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

type ViewMode = 'board' | 'list' | 'calendar';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  startDate?: string;
  project?: { id: string; name: string };
  assignee?: { id: string; name?: string; email?: string; avatar?: string };
  assigneeId?: string;
  labels?: string[];
  position?: number;
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

const priorityOptions = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

// Sortable Task Card Component
function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-all border-white/10 bg-white/5',
          isDragging && 'shadow-lg ring-2 ring-indigo-500'
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{task.title}</h3>
                <Badge
                  variant="secondary"
                  className={cn('text-white text-[10px] shrink-0', priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
              </div>
              {task.description && (
                <p className="text-xs text-white/50 line-clamp-2 mb-2">{task.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-2">
                  {task.project && (
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {task.project.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
                {task.assignee && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-[9px] bg-indigo-500">
                      {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
}: {
  column: typeof columns[0];
  tasks: Task[];
  onAddTask: (status: string) => void;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('h-3 w-3 rounded-full', column.color)} />
        <span className="font-medium">{column.name}</span>
        <Badge variant="secondary" className="ml-auto bg-white/10">
          {tasks.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'space-y-2 min-h-[200px] p-2 rounded-lg transition-colors',
          isOver && 'bg-indigo-500/10 ring-2 ring-indigo-500/30'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        <Button
          variant="ghost"
          className="w-full justify-start text-white/40 hover:text-white/60 hover:bg-white/5"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <Card className="w-72 cursor-grabbing shadow-xl border-indigo-500 bg-[#1a1a2e]">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 mt-1 text-white/30" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm">{task.title}</h3>
              <Badge
                variant="secondary"
                className={cn('text-white text-[10px]', priorityColors[task.priority])}
              >
                {task.priority}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForStatus, setCreateForStatus] = useState('TODO');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  // Fetch data
  const { data: currentUser } = useCurrentUser();
  const { data: users } = useUsers();
  const { data, isLoading } = useTasks({ search: search || undefined, limit: 200 });
  const { data: taskComments, isLoading: commentsLoading } = useTaskComments(selectedTask?.id || '');

  const createTaskMutation = useCreateTask();
  const moveTaskMutation = useMoveTask();
  const updateTaskMutation = useUpdateTask();
  const createCommentMutation = useCreateComment();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allTasks = (data?.data as Task[]) || [];

  // Filter tasks by "My Tasks" if enabled
  const tasks = useMemo(() => {
    if (!showMyTasks || !currentUser) return allTasks;
    return allTasks.filter((t) => t.assigneeId === (currentUser as { id: string }).id);
  }, [allTasks, showMyTasks, currentUser]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  // Calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate || t.startDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: t.startDate || t.dueDate || '',
        end: t.dueDate || t.startDate,
        allDay: true,
        extendedProps: {
          type: 'task' as const,
          status: t.status,
          priority: t.priority,
          projectId: t.project?.id,
          projectName: t.project?.name,
          description: t.description,
        },
      }));
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetColumn.id) {
        moveTaskMutation.mutate(
          { id: taskId, status: targetColumn.id, position: 0 },
          {
            onSuccess: () => {
              toast.success(`Task moved to ${targetColumn.name}`);
            },
          }
        );
      }
      return;
    }

    // Dropped on another task - find target column
    const targetTask = tasks.find(t => t.id === overId);
    if (targetTask) {
      const sourceTask = tasks.find(t => t.id === taskId);
      if (sourceTask && sourceTask.status !== targetTask.status) {
        moveTaskMutation.mutate(
          { id: taskId, status: targetTask.status, position: targetTask.position || 0 },
          {
            onSuccess: () => {
              const col = columns.find(c => c.id === targetTask.status);
              toast.success(`Task moved to ${col?.name}`);
            },
          }
        );
      }
    }
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;

    createTaskMutation.mutate(
      {
        title: newTitle,
        description: newDescription || undefined,
        priority: newPriority as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
        status: createForStatus as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE',
        dueDate: newDueDate || undefined,
        assigneeId: newAssigneeId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Task created');
          setIsCreateDialogOpen(false);
          resetForm();
        },
        onError: () => {
          toast.error('Failed to create task');
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;

    createCommentMutation.mutate(
      { content: newComment, taskId: selectedTask.id },
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

  const handleUpdateTask = (taskId: string, updates: Partial<TaskType>) => {
    updateTaskMutation.mutate(
      { id: taskId, data: updates },
      {
        onSuccess: () => {
          toast.success('Task updated');
        },
      }
    );
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewPriority('MEDIUM');
    setNewDueDate('');
    setNewAssigneeId('');
    setCreateForStatus('TODO');
  };

  const openCreateDialog = (status: string = 'TODO') => {
    setCreateForStatus(status);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your tasks</p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* My Tasks Toggle */}
          <Button
            variant={showMyTasks ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowMyTasks(!showMyTasks)}
            className={cn(
              showMyTasks && 'bg-indigo-500 hover:bg-indigo-600',
              !showMyTasks && 'border-white/10 hover:bg-white/10'
            )}
          >
            <User className="h-4 w-4 mr-2" />
            My Tasks
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1 bg-white/5">
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className={viewMode !== 'board' ? 'hover:bg-white/10' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode !== 'list' ? 'hover:bg-white/10' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode !== 'calendar' ? 'hover:bg-white/10' : ''}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
        </div>
      )}

      {/* Board View with DnD */}
      {!isLoading && viewMode === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
                onAddTask={openCreateDialog}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Assignee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Project</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                      No tasks found. Create your first task!
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{task.title}</span>
                          {task.description && (
                            <p className="text-sm text-white/40 truncate max-w-md">{task.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-white/5">
                          {columns.find(c => c.id === task.status)?.name || task.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-white', priorityColors[task.priority])}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="text-[10px] bg-indigo-500">
                                {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-white/60">{task.assignee.name || task.assignee.email}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-white/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {task.project?.name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {!isLoading && viewMode === 'calendar' && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <CalendarView
              events={calendarEvents}
              onEventClick={(event) => {
                const task = tasks.find(t => t.id === event.id);
                if (task) setSelectedTask(task);
              }}
              onDateSelect={(start, _end) => {
                setNewDueDate(start.toISOString().split('T')[0]);
                openCreateDialog();
              }}
              onEventDrop={(eventId, newStart) => {
                handleUpdateTask(eventId, { dueDate: newStart.toISOString() });
              }}
              initialView="dayGridMonth"
            />
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createForStatus} onValueChange={setCreateForStatus}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', priorityColors[opt.value])} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <span className="text-white/50">Unassigned</span>
                    </SelectItem>
                    {(users as Array<{ id: string; name?: string; email: string; avatar?: string }> || []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[9px] bg-indigo-500">
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {user.name || user.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTitle.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={cn('w-3 h-3 rounded-full', columns.find(c => c.id === selectedTask?.status)?.color)} />
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="flex-1 overflow-auto space-y-4">
              {selectedTask.description && (
                <p className="text-sm text-white/70">{selectedTask.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge className={cn('text-white', priorityColors[selectedTask.priority])}>
                  {selectedTask.priority}
                </Badge>
                <Badge variant="outline">
                  {columns.find(c => c.id === selectedTask.status)?.name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedTask.dueDate && (
                  <div className="flex items-center gap-2 text-white/60">
                    <CalendarDays className="h-4 w-4" />
                    <span>Due: {format(new Date(selectedTask.dueDate), 'PPP')}</span>
                  </div>
                )}
                {selectedTask.project && (
                  <div className="flex items-center gap-2 text-white/60">
                    <FolderKanban className="h-4 w-4" />
                    <span>{selectedTask.project.name}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(value) => {
                      const status = value as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
                      handleUpdateTask(selectedTask.id, { status });
                      setSelectedTask({ ...selectedTask, status });
                    }}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={selectedTask.assigneeId || ''}
                    onValueChange={(value) => {
                      handleUpdateTask(selectedTask.id, { assigneeId: value || null } as Partial<TaskType>);
                      const user = (users as Array<{ id: string; name?: string; email: string; avatar?: string }> || []).find(u => u.id === value);
                      setSelectedTask({
                        ...selectedTask,
                        assigneeId: value || undefined,
                        assignee: user ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar } : undefined,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <span className="text-white/50">Unassigned</span>
                      </SelectItem>
                      {(users as Array<{ id: string; name?: string; email: string; avatar?: string }> || []).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-[9px] bg-indigo-500">
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {user.name || user.email}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-white/60" />
                  <h3 className="font-medium">Comments</h3>
                  <Badge variant="secondary" className="bg-white/10">
                    {(taskComments as Array<unknown> || []).length}
                  </Badge>
                </div>

                {/* Comments List */}
                <ScrollArea className="h-48 mb-4">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                    </div>
                  ) : (taskComments as Array<{ id: string; content: string; author?: { name?: string; email: string; avatar?: string }; createdAt: string }> || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-white/40">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {(taskComments as Array<{ id: string; content: string; author?: { name?: string; email: string; avatar?: string }; createdAt: string }> || []).map((comment) => (
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
                      ))}
                    </div>
                  )}
                </ScrollArea>

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
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
