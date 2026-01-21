'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Calendar, GripVertical, CalendarDays, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks, useCreateTask, useMoveTask, useUpdateTask } from '@/hooks/use-tasks';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  assignee?: { id: string; name: string };
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
              <div className="flex items-center gap-2 text-xs text-white/40">
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

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');

  const { data, isLoading } = useTasks({ search: search || undefined, limit: 200 });
  const createTaskMutation = useCreateTask();
  const moveTaskMutation = useMoveTask();
  const updateTaskMutation = useUpdateTask();

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

  const tasks = (data?.data as Task[]) || [];

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
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Project</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={cn('w-3 h-3 rounded-full', columns.find(c => c.id === selectedTask?.status)?.color)} />
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
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

              <div className="space-y-2">
                <Label>Change Status</Label>
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
