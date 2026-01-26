'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  color?: string;
  emoji?: string;
  status: string;
  progress: number;
  _count?: { tasks: number };
}

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export function ProjectSidebar({ selectedProjectId, onSelectProject }: ProjectSidebarProps) {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');

  const { data: projectsData, isLoading, error } = useProjects({ limit: 100 });
  const createProjectMutation = useCreateProject();

  const projects = (projectsData?.data as Project[]) || [];

  // Log errors for debugging
  if (error) {
    console.error('Projects fetch error:', error);
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    createProjectMutation.mutate(
      { name: newProjectName, color: newProjectColor },
      {
        onSuccess: () => {
          toast.success(t('common.success'));
          setIsCreateDialogOpen(false);
          setNewProjectName('');
        },
        onError: (error) => {
          console.error('Project creation error:', error);
          const message = error instanceof Error ? error.message : t('errors.general');
          toast.error(message);
        },
      }
    );
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
  ];

  return (
    <div className="w-64 border-r border-white/10 flex flex-col h-full bg-white/[0.02]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-white">{t('projects.title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/50 hover:text-white"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Tasks */}
          <button
            onClick={() => onSelectProject(null)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              selectedProjectId === null
                ? 'bg-indigo-500/20 text-white'
                : 'text-white/90 hover:bg-white/5 hover:text-white'
            )}
          >
            <FolderKanban className="h-4 w-4 text-white/70" />
            <span className="flex-1 text-sm font-medium">{t('tasks.allTasks')}</span>
          </button>

          {/* Divider */}
          <div className="my-2 border-t border-white/5" />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 text-sm">
              <p>{t('errors.general')}</p>
              <p className="text-xs mt-1 text-red-400/70">
                {error instanceof Error ? error.message : t('common.unknown')}
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-sm">
              <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('projects.noProjects')}</p>
              <Button
                variant="link"
                size="sm"
                className="text-indigo-400"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                {t('projects.createFirstProject')}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group',
                    selectedProjectId === project.id
                      ? 'bg-indigo-500/20 text-white'
                      : 'text-white/90 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <span className="flex-1 text-sm font-medium truncate">
                    {project.emoji && <span className="mr-1">{project.emoji}</span>}
                    {project.name}
                  </span>
                  <span className="text-xs text-white/60">
                    {project._count?.tasks || 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects.createNewProject')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">{t('projects.projectName')}</Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('projects.fields.color')}</Label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-lg transition-all',
                      newProjectColor === color && 'ring-2 ring-offset-2 ring-offset-[#0a0a14] ring-white'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? t('projects.creating') : t('projects.createProject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
