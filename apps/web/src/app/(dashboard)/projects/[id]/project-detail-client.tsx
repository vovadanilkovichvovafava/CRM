'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  FolderKanban,
  Calendar,
  Users,
  ListChecks,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  color?: string;
  emoji?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name?: string; email: string };
  _count?: { tasks: number; members: number };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANNING: { label: 'Planning', color: 'bg-gray-500 text-white' },
  ACTIVE: { label: 'Active', color: 'bg-green-500 text-white' },
  ON_HOLD: { label: 'On Hold', color: 'bg-yellow-500 text-white' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-500 text-white' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500 text-white' },
};

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-1/3 flex-shrink-0">
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function ProjectDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members'>('overview');

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.projects.get(projectId) as Promise<Project>,
    enabled: !!projectId && projectId !== '_placeholder',
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.projects.delete(projectId),
    onSuccess: () => {
      toast.success(t('projects.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f4f6f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f9]">
        <p className="text-gray-500">{t('projects.notFound')}</p>
        <Button onClick={() => router.push('/projects')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status] || statusConfig.PLANNING;

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-white text-lg font-semibold"
            style={{ backgroundColor: project.color || '#6366f1' }}
          >
            {project.emoji || <FolderKanban className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">{t('projects.project')}</span>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">{t('projects.fields.progress')}</span>
            <span className="font-medium text-gray-900">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('tasks.title')}</span>
            <span className="text-gray-900 font-medium">{project._count?.tasks || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('projects.members')}</span>
            <span className="text-gray-900 font-medium">{project._count?.members || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('projects.fields.endDate')}</span>
            <span className="text-gray-900">
              {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="sf-card">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['overview', 'tasks', 'members'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                    activeTab === tab
                      ? 'border-[#0070d2] text-[#0070d2]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab === 'overview' && t('common.overview')}
                  {tab === 'tasks' && `${t('tasks.title')} (${project._count?.tasks || 0})`}
                  {tab === 'members' && `${t('projects.members')} (${project._count?.members || 0})`}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <DetailField label={t('projects.fields.name')}>
                    <span className="text-sm text-gray-900">{project.name}</span>
                  </DetailField>
                  <DetailField label={t('projects.fields.status')}>
                    <Badge className={status.color}>{status.label}</Badge>
                  </DetailField>
                  <DetailField label={t('projects.fields.progress')}>
                    <div className="flex items-center gap-3">
                      <Progress value={project.progress} className="h-2 flex-1" />
                      <span className="text-sm text-gray-900 font-medium">{project.progress}%</span>
                    </div>
                  </DetailField>
                  <DetailField label={t('common.owner')}>
                    <span className="text-sm text-gray-900">
                      {project.owner?.name || project.owner?.email || t('common.unassigned')}
                    </span>
                  </DetailField>
                </div>
                <div>
                  <DetailField label={t('projects.fields.startDate')}>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {project.startDate
                        ? format(new Date(project.startDate), 'PPP')
                        : '—'}
                    </div>
                  </DetailField>
                  <DetailField label={t('projects.fields.endDate')}>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {project.endDate
                        ? format(new Date(project.endDate), 'PPP')
                        : '—'}
                    </div>
                  </DetailField>
                  <DetailField label={t('common.createdAt')}>
                    <span className="text-sm text-gray-900">
                      {format(new Date(project.createdAt), 'PPP')}
                    </span>
                  </DetailField>
                </div>
                {project.description && (
                  <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <DetailField label={t('common.description')}>
                      <span className="text-sm text-gray-900">{project.description}</span>
                    </DetailField>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="text-center py-8 text-gray-500">
                <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('projects.noTasks')}</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('tasks.addTask')}
                </Button>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('projects.noMembers')}</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('projects.addMember')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
