'use client';

import { useState } from 'react';
import { Plus, Search, LayoutGrid, List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';

type ViewMode = 'board' | 'list' | 'calendar';

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

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useTasks({ search: search || undefined });

  // Demo data
  const demoTasks = [
    { id: '1', title: 'Design landing page', status: 'TODO', priority: 'HIGH', projectId: '1', project: { name: 'Website Redesign' } },
    { id: '2', title: 'Implement user authentication', status: 'IN_PROGRESS', priority: 'URGENT', projectId: '2', project: { name: 'Mobile App' } },
    { id: '3', title: 'Write API documentation', status: 'IN_REVIEW', priority: 'MEDIUM', projectId: '1', project: { name: 'Website Redesign' } },
    { id: '4', title: 'Setup CI/CD pipeline', status: 'DONE', priority: 'HIGH', projectId: '2', project: { name: 'Mobile App' } },
    { id: '5', title: 'Create email templates', status: 'TODO', priority: 'LOW', projectId: '3', project: { name: 'Marketing' } },
    { id: '6', title: 'Review PR #42', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: '1', project: { name: 'Website Redesign' } },
  ];

  const tasks = data?.data || demoTasks;

  const tasksByStatus = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t: any) => t.status === col.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your tasks</p>
        </div>
        <Button>
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
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="mb-3 flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full', column.color)} />
                <span className="font-medium">{column.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {tasksByStatus[column.id]?.length || 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {tasksByStatus[column.id]?.map((task: any) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge
                          variant="secondary"
                          className={cn('text-white text-xs', priorityColors[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.project && (
                        <p className="text-sm text-muted-foreground">
                          {task.project.name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Add task
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => (
                  <tr key={task.id} className="border-b hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{task.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-white', priorityColors[task.priority])}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {task.project?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="flex h-96 items-center justify-center">
            <p className="text-muted-foreground">Calendar view coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
