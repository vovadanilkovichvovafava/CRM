'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, LayoutGrid, List, Calendar, GripVertical, CalendarDays, User, ListChecks, MessageSquare } from 'lucide-react';
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
import { useNavigationStore } from '@/stores/navigation';
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
  createdAt?: string;
  createdBy: string;
  project?: { id: string; name: string; color?: string };
  parent?: { id: string; title: string };
  parentId?: string;
  assignee?: { id: string; name?: string; email?: string; avatar?: string };
  assigneeId?: string;
  labels?: string[];
  position?: number;
  subtasks?: Task[];
  checklist?: Array<{ id: string; title: string; isCompleted: boolean }>;
  _count?: { subtasks: number; comments: number; files?: number };
}

const columnDefinitions = [
  { id: 'TODO', nameKey: 'tasks.status.todo', color: 'bg-slate-400', headerBg: 'bg-slate-100', borderColor: 'border-slate-300' },
  { id: 'IN_PROGRESS', nameKey: 'tasks.status.inProgress', color: 'bg-blue-500', headerBg: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'IN_REVIEW', nameKey: 'tasks.status.inReview', color: 'bg-amber-500', headerBg: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'DONE', nameKey: 'tasks.status.done', color: 'bg-emerald-500', headerBg: 'bg-emerald-50', borderColor: 'border-emerald-200' },
];

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-400',
};

const priorityTextColors: Record<string, string> = {
  URGENT: 'text-red-700 bg-red-50 border-red-200',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  LOW: 'text-slate-600 bg-slate-50 border-slate-200',
};

// Priority weights for sorting (higher = more important = should appear first)
const priorityWeights: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const priorityOptionDefinitions = [
  { value: 'URGENT', labelKey: 'tasks.priority.urgent' },
  { value: 'HIGH', labelKey: 'tasks.priority.high' },
  { value: 'MEDIUM', labelKey: 'tasks.priority.medium' },
  { value: 'LOW', labelKey: 'tasks.priority.low' },
];

// Sortable Task Card Component - Salesforce Light Theme
function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { t } = useTranslation();
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
          'cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-[#0070d2]/30',
          isDragging && 'shadow-xl ring-2 ring-[#0070d2]'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{task.title}</h3>
                <Badge variant="outline" className={cn('text-[10px] font-medium shrink-0 border', priorityTextColors[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
              {task.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>}
              {/* Parent task indicator */}
              {task.parent && (
                <div className="flex items-center gap-1 text-xs text-[#0070d2] mb-2">
                  <span className="text-gray-400">{t('tasks.subtaskOf')}</span>
                  <span className="truncate font-medium">{task.parent.title}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-gray-500">
                  {task.project && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: task.project.color || '#0070d2' }} />
                      <span className="font-medium">{task.project.name}</span>
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  {/* Subtask count */}
                  {(task._count?.subtasks || 0) > 0 && (
                    <span className="flex items-center gap-1 text-[#0070d2]">
                      <ListChecks className="h-3.5 w-3.5" />
                      {task._count?.subtasks}
                    </span>
                  )}
                  {/* Comment count */}
                  {(task._count?.comments || 0) > 0 && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {task._count?.comments}
                    </span>
                  )}
                </div>
                {task.assignee && (
                  <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-[10px] bg-[#0070d2] text-white font-medium">
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

// Droppable Column Component - Salesforce Light Theme
function DroppableColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  addTaskLabel,
}: {
  column: (typeof columnDefinitions)[0] & { name: string };
  tasks: Task[];
  onAddTask: (status: string) => void;
  onTaskClick: (task: Task) => void;
  addTaskLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={cn('mb-3 px-3 py-2.5 rounded-lg flex items-center gap-2', column.headerBg, 'border', column.borderColor)}>
        <div className={cn('h-3 w-3 rounded-full', column.color)} />
        <span className="font-semibold text-sm text-gray-800">{column.name}</span>
        <Badge variant="secondary" className="ml-auto bg-white text-gray-700 text-xs font-semibold border border-gray-200">
          {tasks.length}
        </Badge>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-200 border-2 border-dashed border-transparent',
          isOver && 'bg-[#0070d2]/5 border-[#0070d2]/30'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-[#0070d2] hover:bg-[#0070d2]/5 border border-dashed border-gray-300 hover:border-[#0070d2]/30"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {addTaskLabel}
        </Button>
      </div>
    </div>
  );
}

// Task Card for Drag Overlay - Salesforce Light Theme
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <Card className="w-80 cursor-grabbing shadow-2xl border-2 border-[#0070d2] bg-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 mt-0.5 text-gray-400" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-900">{task.title}</h3>
              <Badge variant="outline" className={cn('text-[10px] font-medium border', priorityTextColors[task.priority])}>
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
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskIdFromUrl = searchParams.get('taskId');
  const { pendingTaskId, clearPendingTaskId } = useNavigationStore();

  // Create translated columns and priority options
  const columns = useMemo(
    () => columnDefinitions.map((col) => ({ ...col, name: t(col.nameKey) })),
    [t]
  );
  const priorityOptions = useMemo(
    () => priorityOptionDefinitions.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t]
  );

  // Use pending task ID from store or URL parameter
  const targetTaskId = pendingTaskId || taskIdFromUrl;

  // Debug logging
  console.log('[TasksPage] targetTaskId:', targetTaskId, 'pendingTaskId:', pendingTaskId, 'taskIdFromUrl:', taskIdFromUrl);

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForStatus, setCreateForStatus] = useState('TODO');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showMyTasks, setShowMyTasks] = useState(false);

  // Navigate to task detail page
  const handleTaskClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  // Fetch data
  const { data: currentUser } = useCurrentUser();
  const { data: users } = useUsers();
  const { data, isLoading, error: tasksError } = useTasks({
    projectId: selectedProjectId || undefined,
    search: search || undefined,
    limit: 200,
  });

  // Show toast for API errors
  useEffect(() => {
    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      toast.error(t('errors.general') + ': ' + (tasksError instanceof Error ? tasksError.message : t('common.unknown')));
    }
  }, [tasksError, t]);

  // Handle task navigation from URL or pending
  useEffect(() => {
    if (targetTaskId && targetTaskId !== '_placeholder') {
      router.push(`/tasks/${targetTaskId}`);
      if (pendingTaskId) {
        clearPendingTaskId();
      }
    }
  }, [targetTaskId, pendingTaskId, router, clearPendingTaskId]);

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
    return columnDefinitions.reduce(
      (acc, col) => {
        acc[col.id] = tasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => {
            // Sort by priority first (URGENT on top)
            const priorityDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            // Then by position
            return (a.position || 0) - (b.position || 0);
          });
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
        const statusName = t(columnDefinitions.find((c) => c.id === targetColumn.id)?.nameKey || '');
        moveTaskMutation.mutate({ id: taskId, status: targetColumn.id, position: 0 }, { onSuccess: () => toast.success(t('tasks.messages.moved', { status: statusName })) });
      }
      return;
    }

    const targetTask = tasks.find((tsk) => tsk.id === overId);
    if (targetTask) {
      const sourceTask = tasks.find((tsk) => tsk.id === taskId);
      if (sourceTask && sourceTask.status !== targetTask.status) {
        const statusName = t(columnDefinitions.find((c) => c.id === targetTask.status)?.nameKey || '');
        moveTaskMutation.mutate(
          { id: taskId, status: targetTask.status, position: targetTask.position || 0 },
          { onSuccess: () => toast.success(t('tasks.messages.moved', { status: statusName })) }
        );
      }
    }
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;

    // Validate due date is not in the past
    if (newDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(newDueDate);
      if (dueDate < today) {
        toast.error(t('tasks.messages.dueDatePast'));
        return;
      }
    }

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
          toast.success(t('tasks.messages.created'));
          setIsCreateDialogOpen(false);
          resetForm();
        },
        onError: (error) => {
          console.error('Task creation error:', error);
          const message = error instanceof Error ? error.message : t('errors.general');
          toast.error(message);
        },
      }
    );
  };

  const handleUpdateTask = (taskId: string, updates: Partial<TaskType>) => {
    updateTaskMutation.mutate({ id: taskId, data: updates }, { onSuccess: () => toast.success(t('tasks.messages.updated')) });
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
    <div className="flex h-[calc(100vh-4rem)] -m-6 bg-[#f4f6f9]">
      {/* Project Sidebar */}
      <ProjectSidebar selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Salesforce Light Theme */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('tasks.title')}</h1>
              <p className="text-sm text-gray-500">
                {selectedProjectId ? t('tasks.projectTasks') : t('tasks.allTasks')}
              </p>
            </div>
            <Button
              onClick={() => openCreateDialog()}
              className="bg-[#0070d2] hover:bg-[#005fb2] text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('tasks.addTask')}
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('tasks.searchTasks')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#0070d2] focus:ring-[#0070d2]"
                />
              </div>

              <Button
                variant={showMyTasks ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMyTasks(!showMyTasks)}
                className={cn(
                  showMyTasks && 'bg-[#0070d2] hover:bg-[#005fb2] text-white',
                  !showMyTasks && 'border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                <User className="h-4 w-4 mr-2" />
                {t('tasks.myTasks')}
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className={cn(viewMode === 'board' ? 'bg-[#0070d2] text-white hover:bg-[#005fb2]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(viewMode === 'list' ? 'bg-[#0070d2] text-white hover:bg-[#005fb2]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={cn(viewMode === 'calendar' ? 'bg-[#0070d2] text-white hover:bg-[#005fb2]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0070d2]" />
            </div>
          )}

          {/* Board View */}
          {!isLoading && viewMode === 'board' && (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-5 overflow-x-auto pb-4">
                {columns.map((column) => (
                  <DroppableColumn key={column.id} column={column} tasks={tasksByStatus[column.id] || []} onAddTask={openCreateDialog} onTaskClick={handleTaskClick} addTaskLabel={t('tasks.addTask')} />
                ))}
              </div>
              <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
            </DndContext>
          )}

          {/* List View - Salesforce Light Theme */}
          {!isLoading && viewMode === 'list' && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.title')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.priority')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.assignee')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.dueDate')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tasks.fields.project')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          {t('tasks.noTasks')}
                        </td>
                      </tr>
                    ) : (
                      [...tasks].sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)).map((task) => (
                        <tr key={task.id} className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => handleTaskClick(task)}>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-gray-900">{task.title}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant="outline" className={cn('font-medium', columns.find((c) => c.id === task.status)?.borderColor)}>
                              <span className={cn('w-2 h-2 rounded-full mr-1.5', columns.find((c) => c.id === task.status)?.color)} />
                              {columns.find((c) => c.id === task.status)?.name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant="outline" className={cn('font-medium border', priorityTextColors[task.priority])}>{task.priority}</Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            {task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                  <AvatarImage src={task.assignee.avatar} />
                                  <AvatarFallback className="text-[10px] bg-[#0070d2] text-white font-medium">{task.assignee.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-700">{task.assignee.name || task.assignee.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">{task.project?.name || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Calendar View - Salesforce Light Theme */}
          {!isLoading && viewMode === 'calendar' && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <CalendarView
                  events={calendarEvents}
                  onEventClick={(event) => {
                    const task = tasks.find((t) => t.id === event.id);
                    if (task) handleTaskClick(task);
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
            <DialogTitle>{t('tasks.createNewTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('tasks.fields.title')} *</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t('tasks.fields.title') + '...'} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('tasks.fields.description')}</Label>
              <Textarea id="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder={t('tasks.fields.description') + '...'} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('tasks.fields.status')}</Label>
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
                <Label>{t('tasks.fields.priority')}</Label>
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
                <Label htmlFor="dueDate">{t('tasks.fields.dueDate')}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('tasks.fields.assignee')}</Label>
                <Select value={newAssigneeId || '__none__'} onValueChange={(val) => setNewAssigneeId(val === '__none__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tasks.fields.assignee')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-white/50">{t('common.unassigned')}</span>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTitle.trim() || createTaskMutation.isPending}>
              {createTaskMutation.isPending ? t('tasks.creating') : t('tasks.createTask')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
