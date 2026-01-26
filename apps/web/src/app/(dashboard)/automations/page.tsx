'use client';

import { useState, useMemo } from 'react';
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
  Settings,
  RefreshCw,
  Filter,
  ChevronDown,
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

interface MetricProps {
  label: string;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
}

function Metric({ label, value, isActive, onClick }: MetricProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-md transition-all duration-200',
        isActive
          ? 'bg-[#0070d2] text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap', isActive ? 'text-white/80' : 'text-gray-500')}>
        {label}
      </span>
    </button>
  );
}

export default function AutomationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workflows', search],
    queryFn: () =>
      api.workflows.list({
        search: search || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(t('common.success'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.workflows.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(t('common.success'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.workflows.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(t('common.success'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(t('errors.general'));
      }
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${t('common.confirm')} "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const workflows = (data?.data as WorkflowType[]) || [];

  const metrics = useMemo(() => {
    return {
      all: workflows.length,
      active: workflows.filter((w) => w.isActive).length,
      inactive: workflows.filter((w) => !w.isActive).length,
    };
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    if (activeFilter === 'all') return workflows;
    if (activeFilter === 'active') return workflows.filter((w) => w.isActive);
    if (activeFilter === 'inactive') return workflows.filter((w) => !w.isActive);
    return workflows;
  }, [workflows, activeFilter]);

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('automations.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('automations.title')}
                </h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter className="h-5 w-5" />
            </button>

            <Link href="/automations/editor?id=new">
              <Button
                variant="outline"
                className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('common.new')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            <Metric
              label={t('common.all')}
              value={metrics.all}
              isActive={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <Metric
              label={t('automations.active', 'Active')}
              value={metrics.active}
              isActive={activeFilter === 'active'}
              onClick={() => setActiveFilter('active')}
            />
            <Metric
              label={t('automations.inactive', 'Inactive')}
              value={metrics.inactive}
              isActive={activeFilter === 'inactive'}
              onClick={() => setActiveFilter('inactive')}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('automations.searchAutomations')}
              className="w-64 pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {filteredWorkflows.length} {t('automations.workflows', 'workflows')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="sf-card flex flex-col items-center justify-center py-16">
            <Workflow className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noData')}</h3>
            <p className="text-gray-500 mb-4">
              {search ? t('common.notFound') : t('automations.noAutomations')}
            </p>
            <Link href="/automations/editor?id=new">
              <Button className="bg-[#0070d2] hover:bg-[#005fb2]">
                <Plus className="mr-2 h-4 w-4" />
                {t('automations.createAutomation')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => {
              const TriggerIcon = TRIGGER_ICONS[workflow.trigger] || Zap;
              const actionsCount = (workflow.actions as unknown[]).length;

              return (
                <Card
                  key={workflow.id}
                  className={cn(
                    'bg-white border-gray-200 hover:shadow-md transition-shadow group cursor-pointer',
                    !workflow.isActive && 'opacity-70'
                  )}
                >
                  <Link href={`/automations/editor?id=${workflow.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base text-gray-900 truncate">
                              {workflow.name}
                            </CardTitle>
                            {workflow.isActive ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                {t('automations.active', 'Active')}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {t('automations.inactive', 'Inactive')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {workflow.description || t('common.noData')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Trigger */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                          <TriggerIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {TRIGGER_LABELS[workflow.trigger] || workflow.trigger}
                          </p>
                          <p className="text-xs text-gray-500">
                            on {workflow.object.displayName}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                        <span>{actionsCount} {t('automations.actions', 'action')}{actionsCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{workflow._count.executions} {t('automations.runs', 'runs')}</span>
                      </div>
                    </CardContent>
                  </Link>

                  <div className="px-4 pb-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(workflow.updatedAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7',
                          workflow.isActive
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMutation.mutate(workflow.id);
                        }}
                        title={workflow.isActive ? t('automations.deactivate', 'Deactivate') : t('automations.activate', 'Activate')}
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
                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          duplicateMutation.mutate(workflow.id);
                        }}
                        title={t('common.copy', 'Duplicate')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(workflow.id, workflow.name);
                        }}
                        title={t('common.delete')}
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
