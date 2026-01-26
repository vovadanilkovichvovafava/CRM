'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarView, type CalendarEvent } from '@/components/calendar/calendar-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Plus, Calendar, CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  project?: { id: string; name: string; color?: string };
}

const PRIORITY_OPTIONS = [
  { value: 'URGENT', labelKey: 'common.priorities.urgent', color: 'bg-red-500' },
  { value: 'HIGH', labelKey: 'common.priorities.high', color: 'bg-orange-500' },
  { value: 'MEDIUM', labelKey: 'common.priorities.medium', color: 'bg-yellow-500' },
  { value: 'LOW', labelKey: 'common.priorities.low', color: 'bg-gray-500' },
];

const STATUS_OPTIONS = [
  { value: 'TODO', labelKey: 'tasks.status.todo' },
  { value: 'IN_PROGRESS', labelKey: 'tasks.status.inProgress' },
  { value: 'IN_REVIEW', labelKey: 'tasks.status.inReview' },
  { value: 'DONE', labelKey: 'tasks.status.done' },
];

export default function CalendarPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Fetch all tasks (with dates)
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: () => api.tasks.list({ limit: 500 }),
  });

  // Update task mutation (for drag-drop rescheduling)
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('tasks.messages.updated'));
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateDialogOpen(false);
      setNewTaskTitle('');
      setSelectedDateRange(null);
      toast.success(t('tasks.messages.created'));
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  // Convert tasks to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const tasks = (tasksData?.data as Task[]) || [];
    return tasks
      .filter((task) => task.dueDate || task.startDate)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: task.startDate || task.dueDate || new Date().toISOString(),
        end: task.dueDate || task.startDate,
        allDay: true,
        extendedProps: {
          type: 'task' as const,
          status: task.status,
          priority: task.priority,
          projectId: task.project?.id,
          projectName: task.project?.name,
          description: task.description,
        },
      }));
  }, [tasksData]);

  // Get selected task details
  const selectedTask = useMemo(() => {
    if (!selectedEvent) return null;
    const tasks = (tasksData?.data as Task[]) || [];
    return tasks.find((t) => t.id === selectedEvent.id);
  }, [selectedEvent, tasksData]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedDateRange({ start, end });
    setIsCreateDialogOpen(true);
  };

  const handleEventDrop = (eventId: string, newStart: Date, newEnd: Date | null) => {
    updateTaskMutation.mutate({
      id: eventId,
      data: {
        startDate: newStart.toISOString(),
        dueDate: newEnd?.toISOString() || newStart.toISOString(),
      },
    });
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !selectedDateRange) return;

    createTaskMutation.mutate({
      title: newTaskTitle,
      priority: newTaskPriority,
      startDate: selectedDateRange.start.toISOString(),
      dueDate: selectedDateRange.end.toISOString(),
    });
  };

  // Stats
  const stats = useMemo(() => {
    const tasks = (tasksData?.data as Task[]) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;

    const dueToday = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime() && t.status !== 'DONE';
    }).length;

    const thisWeek = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return due >= today && due <= weekEnd && t.status !== 'DONE';
    }).length;

    return { overdue, dueToday, thisWeek };
  }, [tasksData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('calendar.title')}</h1>
            <p className="text-gray-600">View and manage tasks by date</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('tasks.addTask')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="sf-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{t('common.overdue')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="sf-card border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{t('common.today')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dueToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="sf-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{t('timeTracking.thisWeek')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="sf-card overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-900">Task Calendar</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Tasks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Overdue
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <p className="text-sm text-gray-500">Loading calendar...</p>
              </div>
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-blue-500/60" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No scheduled tasks</h3>
              <p className="text-gray-600 max-w-sm mb-6">
                Your calendar is empty. Create a task with a due date to see it here.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="p-6">
              <CalendarView
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onEventDrop={handleEventDrop}
                editable={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {selectedTask.description && (
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge
                  className={cn(
                    'text-white',
                    selectedTask.priority === 'URGENT' && 'bg-red-500',
                    selectedTask.priority === 'HIGH' && 'bg-orange-500',
                    selectedTask.priority === 'MEDIUM' && 'bg-yellow-500',
                    selectedTask.priority === 'LOW' && 'bg-gray-500'
                  )}
                >
                  {selectedTask.priority}
                </Badge>
                <Badge variant="outline">{selectedTask.status.replace('_', ' ')}</Badge>
                {selectedTask.project && (
                  <Badge variant="secondary">{selectedTask.project.name}</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedTask.startDate && (
                  <div>
                    <span className="text-muted-foreground">{t('tasks.fields.startDate')}:</span>{' '}
                    {format(new Date(selectedTask.startDate), 'PP')}
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <span className="text-muted-foreground">{t('common.due')}:</span>{' '}
                    {format(new Date(selectedTask.dueDate), 'PP')}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => window.location.href = `/tasks/${selectedTask?.id}`}>
              {t('common.details')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.createNewTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('common.title')}</Label>
              <Input
                id="title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('tasks.taskTitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t('common.priority')}</Label>
              <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', opt.color)} />
                        {t(opt.labelKey)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDateRange && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('common.date')}:</span>{' '}
                  {format(selectedDateRange.start, 'PPP')}
                  {selectedDateRange.end.getTime() !== selectedDateRange.start.getTime() && (
                    <> - {format(selectedDateRange.end, 'PPP')}</>
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? t('tasks.creating') : t('tasks.createTask')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
