'use client';

import { useState } from 'react';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/use-projects';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-500',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useProjects({ search: search || undefined });

  // Demo data
  const demoProjects = [
    { id: '1', name: 'Website Redesign', description: 'Complete overhaul of company website', status: 'ACTIVE', progress: 65, dueDate: '2026-02-15', _count: { tasks: 24 } },
    { id: '2', name: 'Mobile App Launch', description: 'Launch new mobile application', status: 'PLANNING', progress: 20, dueDate: '2026-03-01', _count: { tasks: 15 } },
    { id: '3', name: 'Q1 Marketing Campaign', description: 'Marketing campaign for Q1', status: 'ACTIVE', progress: 45, dueDate: '2026-01-31', _count: { tasks: 18 } },
    { id: '4', name: 'CRM Integration', description: 'Integrate new CRM system', status: 'COMPLETED', progress: 100, dueDate: '2026-01-10', _count: { tasks: 32 } },
  ];

  const projects = data?.data || demoProjects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track progress</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: any) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                </div>
                <Badge variant="secondary" className={`${statusColors[project.status]} text-white`}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 line-clamp-2">
                {project.description}
              </CardDescription>

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{project._count?.tasks || 0} tasks</span>
                {project.dueDate && (
                  <span>Due {formatDate(project.dueDate)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
