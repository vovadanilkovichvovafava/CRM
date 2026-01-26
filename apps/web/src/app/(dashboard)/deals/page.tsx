'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Filter,
  Settings,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Target,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { api, ApiError } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

const dealFields = [
  { name: 'name', displayName: 'Deal Name', type: 'TEXT', isRequired: true },
  { name: 'value', displayName: 'Deal Value', type: 'CURRENCY', isRequired: true },
  { name: 'company', displayName: 'Company', type: 'TEXT', isRequired: false },
  { name: 'contact', displayName: 'Contact', type: 'TEXT', isRequired: false },
  { name: 'expectedCloseDate', displayName: 'Expected Close', type: 'DATE', isRequired: false },
  { name: 'notes', displayName: 'Notes', type: 'LONG_TEXT', isRequired: false },
];

interface DealRecord {
  id: string;
  objectId: string;
  stage: string | null;
  data: {
    name?: string;
    value?: number;
    company?: string;
    contact?: string;
    expectedCloseDate?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StageConfig {
  id: string;
  nameKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const stageConfigs: StageConfig[] = [
  { id: 'lead', nameKey: 'deals.stages.lead', color: '#6B7280', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700' },
  { id: 'qualified', nameKey: 'deals.stages.qualified', color: '#3B82F6', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { id: 'proposal', nameKey: 'deals.stages.proposal', color: '#F59E0B', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700' },
  { id: 'negotiation', nameKey: 'deals.stages.negotiation', color: '#8B5CF6', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', textColor: 'text-purple-700' },
  { id: 'closed_won', nameKey: 'deals.stages.closed_won', color: '#10B981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', textColor: 'text-emerald-700' },
  { id: 'closed_lost', nameKey: 'deals.stages.closed_lost', color: '#EF4444', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700' },
];

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor: string;
}

function MetricCard({ icon, label, value, trend, trendValue, accentColor }: MetricCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border-l-4 p-5 shadow-sm hover:shadow-md transition-all duration-200',
      accentColor
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
            trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
          )}>
            {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> :
             trend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : null}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDealsState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-6">
        <DollarSign className="h-10 w-10 text-emerald-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('deals.noDealsYet')}</h3>
      <p className="text-gray-500 text-center max-w-md">{t('deals.noDealsHint')}</p>
    </div>
  );
}

export default function DealsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dealsObjectId, setDealsObjectId] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (value: number) => {
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    const currency = i18n.language === 'ru' ? 'RUB' : 'USD';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'deals'],
    queryFn: async () => {
      try {
        return await api.objects.getByName('deals');
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await api.objects.seedSystem();
          return await api.objects.getByName('deals');
        }
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      setDealsObjectId((objectData as { id: string }).id);
    }
  }, [objectData]);

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['records', 'deals', dealsObjectId],
    queryFn: () => api.records.list({ objectId: dealsObjectId! }),
    enabled: !!dealsObjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success(t('deals.deleteDeal'));
      queryClient.invalidateQueries({ queryKey: ['records', 'deals'] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const deals = (recordsData?.data as DealRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!dealsObjectId);

  const filteredDeals = useMemo(() => {
    if (!activeStageFilter) return deals;
    return deals.filter(d => d.stage === activeStageFilter);
  }, [deals, activeStageFilter]);

  const metrics = useMemo(() => {
    const totalValue = deals.reduce((sum, d) => sum + Number(d.data?.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const lostDeals = deals.filter(d => d.stage === 'closed_lost');
    const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
    const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.data?.value || 0), 0);
    const lostValue = lostDeals.reduce((sum, d) => sum + Number(d.data?.value || 0), 0);
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0;
    const avgDealSize = activeDeals.length > 0 ? Math.round(totalValue / activeDeals.length) : 0;

    return { totalValue, wonValue, lostValue, activeDeals: activeDeals.length, winRate, avgDealSize };
  }, [deals]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, DealRecord[]> = {};
    stageConfigs.forEach(stage => {
      grouped[stage.id] = deals.filter(d => d.stage === stage.id);
    });
    return grouped;
  }, [deals]);

  const handleAddDeal = () => {
    if (!dealsObjectId) {
      if (objectError) {
        toast.error(t('errors.general'));
      } else {
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchRecords();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStageConfig = (stageId: string | null) => {
    return stageConfigs.find(s => s.id === stageId) || stageConfigs[0];
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('deals.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{t('deals.myDeals')}</h1>
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
            <Button
              onClick={handleAddDeal}
              className="bg-[#0070d2] hover:bg-[#005fb2] text-white"
            >
              {objectLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : objectError ? (
                <AlertCircle className="mr-2 h-4 w-4" />
              ) : null}
              {t('deals.addDeal')}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            label={t('deals.pipelineValue')}
            value={formatCurrency(metrics.totalValue)}
            accentColor="border-l-blue-500"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label={t('deals.wonValue')}
            value={formatCurrency(metrics.wonValue)}
            accentColor="border-l-emerald-500"
            trend="up"
            trendValue={`${metrics.winRate}%`}
          />
          <MetricCard
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            label={t('deals.lostValue')}
            value={formatCurrency(metrics.lostValue)}
            accentColor="border-l-red-500"
          />
          <MetricCard
            icon={<Target className="h-5 w-5 text-purple-600" />}
            label={t('deals.activeDeals')}
            value={String(metrics.activeDeals)}
            accentColor="border-l-purple-500"
          />
          <MetricCard
            icon={<PieChart className="h-5 w-5 text-amber-600" />}
            label={t('deals.winRate')}
            value={`${metrics.winRate}%`}
            accentColor="border-l-amber-500"
          />
          <MetricCard
            icon={<DollarSign className="h-5 w-5 text-cyan-600" />}
            label={t('deals.avgDealSize')}
            value={formatCurrency(metrics.avgDealSize)}
            accentColor="border-l-cyan-500"
          />
        </div>
      </div>

      {/* Stage Pipeline Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveStageFilter(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              !activeStageFilter
                ? 'bg-[#0070d2] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t('common.all')} ({deals.length})
          </button>
          {stageConfigs.map(stage => {
            const count = dealsByStage[stage.id]?.length || 0;
            const stageValue = dealsByStage[stage.id]?.reduce((sum, d) => sum + Number(d.data?.value || 0), 0) || 0;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageFilter(stage.id === activeStageFilter ? null : stage.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                  activeStageFilter === stage.id
                    ? `${stage.bgColor} ${stage.textColor} ${stage.borderColor}`
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{t(stage.nameKey)}</span>
                <span className="ml-1 text-xs opacity-70">
                  {count} · {formatCurrency(stageValue)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {filteredDeals.length} {t('deals.items')} • {t('deals.filteredBy')}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('deals.searchDeals')}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0070d2] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
            </div>
          ) : filteredDeals.length === 0 ? (
            <EmptyDealsState t={t} />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('deals.fields.name')}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('deals.fields.value')}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('deals.fields.stage')}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('deals.fields.company')}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('deals.fields.expectedCloseDate')}
                  </th>
                  <th className="w-24 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.map((deal) => {
                  const stage = getStageConfig(deal.stage);
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm font-medium">
                            {getInitials(deal.data?.name || 'D')}
                          </div>
                          <Link
                            href={`/deals/${deal.id}`}
                            className="font-medium text-[#0070d2] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deal.data?.name || t('common.unknown')}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(deal.data?.value || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                            stage.bgColor,
                            stage.textColor,
                            stage.borderColor
                          )}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {t(stage.nameKey)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {deal.data?.company ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{deal.data.company}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {deal.data?.expectedCloseDate ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(deal.data.expectedCloseDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                            onClick={() => router.push(`/deals/${deal.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            onClick={() => {
                              if (confirm(t('deals.deleteDeal') + '?')) {
                                deleteMutation.mutate(deal.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {dealsObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={dealsObjectId}
          objectName={t('deals.title')}
          fields={dealFields}
          defaultStage="lead"
        />
      )}
    </div>
  );
}
