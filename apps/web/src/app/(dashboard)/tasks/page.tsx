'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Calendar, GripVertical, CalendarDays, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks, useCreateTask, useMoveTask, useUpdateTask } from '@/hooks/use-tasks';
import { useUsers, useCurrentUser } from '@/hooks/use-users';
import { cn } from '@/lib/utils';
import type { Task as TaskType } from '@/types';
import { CalendarView, type CalendarEvent } from '@/components/calendar/calendar-view';
import { ProjectSidebar } from '@/components/tasks/project-sidebar';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
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
  project?: { id: string; name: string; color?: string };
  assignee?: { id: string; name?: string; email?: string; avatar?: string };
  assigneeId?: string;
  labels?: string[];
  position?: number;
  subtasks?: Task[];
  checklist?: Array<{ id: string; title: string; isCompleted: boolean }>;
  _count?: { subtasks: number; comments: number };
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

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
                <Badge variant="secondary" className={cn('text-white text-[10px] shrink-0', priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
              {task.description && <p className="text-xs text-white/50 line-clamp-2 mb-2">{task.description}</p>}
              <div className="flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-2">
                  {task.project && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: task.project.color || '#6366f1' }} />
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
  column: (typeof columns)[0];
  tasks: Task[];
  onAddTask: (status: string) => void;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('h-3 w-3 rounded-full', column.color)} />
        <span className="font-medium text-sm">{column.name}</span>
        <Badge variant="secondary" className="ml-auto bg-white/10 text-xs">
          {tasks.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn('space-y-2 min-h-[200px] p-2 rounded-lg transition-colors', isOver && 'bg-indigo-500/10 ring-2 ring-indigo-500/30')}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
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
              <Badge variant="secondary" className={cn('text-white text-[10px]', priorityColors[task.priority])}>
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForStatus, setCreateForStatus] = useState('TODO');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showMyTasks, setShowMyTasks] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  // Fetch data
  const { data: currentUser } = useCurrentUser();
  const { data: users } = useUsers();
  const { data, isLoading } = useTasks({
    projectId: selectedProjectId || undefined,
    search: search || undefined,
    limit: 200,
  });

  const createTaskMutation = useCreateTask();
  const moveTaskMutation = useMoveTask();
  const updateTaskMutation = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter tasks by "My Tasks" if enabled
  const tasks = useMemo(() => {
    const allTasks = (data?.data as Task[]) || [];
    if (!showMyTasks || !currentUser) return allTasks;
    return allTasks.filter((t) => t.assigneeId === (currentUser as { id: string }).id);
  }, [data?.data, showMyTasks, currentUser]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = tasks.filter((t) => t.status === col.id).sort((a, b) => (a.position || 0) - (b.position || 0));
        return acc;
      },
      {} as Record<string, Task[]>
    );
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
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const targetColumn = columns.find((col) => col.id === overId);

    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn.id) {
        moveTaskMutation.mutate({ id: taskId, status: targetColumn.id, position: 0 }, { onSuccess: () => toast.success(`Task moved to ${targetColumn.name}`) });
      }
      return;
    }

    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      const sourceTask = tasks.find((t) => t.id === taskId);
      if (sourceTask && sourceTask.status !== targetTask.status) {
        moveTaskMutation.mutate(
          { id: taskId, status: targetTask.status, position: targetTask.position || 0 },
          { onSuccess: () => toast.success(`Task moved to ${columns.find((c) => c.id === targetTask.status)?.name}`) }
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
        projectId: selectedProjectId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Task created');
          setIsCreateDialogOpen(false);
          resetForm();
        },
        onError: () => toast.error('Failed to create task'),
      }
    );
  };

  const handleUpdateTask = (taskId: string, updates: Partial<TaskType>) => {
    updateTaskMutation.mutate({ id: taskId, data: updates }, { onSuccess: () => toast.success('Task updated') });
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

  const usersList = (users as Array<{ id: string; name?: string; email: string; avatar?: string }>) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Project Sidebar */}
      <ProjectSidebar selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
              <p className="text-sm text-white/50">
                {selectedProjectId ? 'Project tasks' : 'All tasks across projects'}
              </p>
            </div>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>

              <Button
                variant={showMyTasks ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowMyTasks(!showMyTasks)}
                className={cn(showMyTasks && 'bg-indigo-500 hover:bg-indigo-600', !showMyTasks && 'border-white/10 hover:bg-white/10')}
              >
                <User className="h-4 w-4 mr-2" />
                My Tasks
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1 bg-white/5">
              <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('board')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
            </div>
          )}

          {/* Board View */}
          {!isLoading && viewMode === 'board' && (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                  <DroppableColumn key={column.id} column={column} tasks={tasksByStatus[column.id] || []} onAddTask={openCreateDialog} onTaskClick={setSelectedTask} />
                ))}
              </div>
              <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
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
                        <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setSelectedTask(task)}>
                          <td className="px-4 py-3">
                            <span className="font-medium">{task.title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-white/5">
                              {columns.find((c) => c.id === task.status)?.name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn('text-white', priorityColors[task.priority])}>{task.priority}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={task.assignee.avatar} />
                                  <AvatarFallback className="text-[10px] bg-indigo-500">{task.assignee.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-white/60">{task.assignee.name || task.assignee.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-white/40">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}</td>
                          <td className="px-4 py-3 text-sm text-white/60">{task.project?.name || '-'}</td>
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
                    const task = tasks.find((t) => t.id === event.id);
                    if (task) setSelectedTask(task);
                  }}
                  onDateSelect={(start) => {
                    setNewDueDate(start.toISOString().split('T')[0]);
                    openCreateDialog();
                  }}
                  onEventDrop={(eventId, newStart) => handleUpdateTask(eventId, { dueDate: newStart.toISOString() })}
                  initialView="dayGridMonth"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Add a description..." rows={3} />
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
                <Input id="dueDate" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={newAssigneeId || '__none__'} onValueChange={(val) => setNewAssigneeId(val === '__none__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-white/50">Unassigned</span>
                    </SelectItem>
                    {usersList.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[9px] bg-indigo-500">{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
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
            <Button onClick={handleCreateTask} disabled={!newTitle.trim() || createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        users={usersList}
        onClose={() => setSelectedTask(null)}
        onUpdate={(task) => setSelectedTask(task)}
      />
    </div>
  );
}
