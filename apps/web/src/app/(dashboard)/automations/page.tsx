'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Workflow,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Play,
  Pause,
  Zap,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';

interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  objectId: string;
  trigger: string;
  conditions: unknown[];
  actions: unknown[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  object: { id: string; name: string; displayName: string; icon: string | null };
  _count: { executions: number };
}

const TRIGGER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RECORD_CREATED: Zap,
  RECORD_UPDATED: Edit,
  RECORD_DELETED: Trash2,
  FIELD_CHANGED: Edit,
  STAGE_CHANGED: Workflow,
  TIME_BASED: Clock,
};

const TRIGGER_LABELS: Record<string, string> = {
  RECORD_CREATED: 'Record Created',
  RECORD_UPDATED: 'Record Updated',
  RECORD_DELETED: 'Record Deleted',
  FIELD_CHANGED: 'Field Changed',
  STAGE_CHANGED: 'Stage Changed',
  TIME_BASED: 'Scheduled',
};

export default function AutomationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', search, filterActive],
    queryFn: () =>
      api.workflows.list({
        search: search || undefined,
        isActive: filterActive ?? undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete workflow');
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.workflows.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow status updated');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to update workflow');
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.workflows.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow duplicated');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to duplicate workflow');
      }
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const workflows = data?.data || [];

  const activeCount = workflows.filter((w) => w.isActive).length;
  const inactiveCount = workflows.filter((w) => !w.isActive).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('automations.title')}</h1>
            <p className="text-sm text-white/40">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} ({activeCount} active)
            </p>
          </div>
        </div>

        <Link href="/automations/editor?id=new">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" />
            {t('automations.addAutomation')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('automations.searchAutomations')}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filterActive === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(null)}
              className={cn(
                filterActive === null
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'border-white/10 text-white/60 hover:text-white'
              )}
            >
              {t('common.all')}
            </Button>
            <Button
              variant={filterActive === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(true)}
              className={cn(
                filterActive === true
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'border-white/10 text-white/60 hover:text-white'
              )}
            >
              <Play className="h-3 w-3 mr-1" />
              Active ({activeCount})
            </Button>
            <Button
              variant={filterActive === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(false)}
              className={cn(
                filterActive === false
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'border-white/10 text-white/60 hover:text-white'
              )}
            >
              <Pause className="h-3 w-3 mr-1" />
              Inactive ({inactiveCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Workflow className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/40 mb-4">
              {search ? t('common.notFound') : t('automations.noAutomations')}
            </p>
            <Link href="/automations/editor?id=new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                {t('automations.createAutomation')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => {
              const TriggerIcon = TRIGGER_ICONS[workflow.trigger] || Zap;
              const actionsCount = (workflow.actions as unknown[]).length;

              return (
                <Card
                  key={workflow.id}
                  className={cn(
                    'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] transition-colors group cursor-pointer',
                    !workflow.isActive && 'opacity-60'
                  )}
                >
                  <Link href={`/automations/editor?id=${workflow.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base text-white truncate">
                              {workflow.name}
                            </CardTitle>
                            {workflow.isActive ? (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="text-xs text-white/40">Inactive</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1 truncate">
                            {workflow.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Trigger */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                          <TriggerIcon className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">
                            {TRIGGER_LABELS[workflow.trigger] || workflow.trigger}
                          </p>
                          <p className="text-xs text-white/40">
                            on {workflow.object.displayName}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-white/50">
                        <span>{actionsCount} action{actionsCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{workflow._count.executions} runs</span>
                      </div>
                    </CardContent>
                  </Link>

                  <div className="px-4 pb-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-white/30">
                      {formatRelativeTime(workflow.updatedAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7',
                          workflow.isActive
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                            : 'text-white/40 hover:text-green-400 hover:bg-green-500/10'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMutation.mutate(workflow.id);
                        }}
                        title={workflow.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {workflow.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          duplicateMutation.mutate(workflow.id);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-red-400"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(workflow.id, workflow.name);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
