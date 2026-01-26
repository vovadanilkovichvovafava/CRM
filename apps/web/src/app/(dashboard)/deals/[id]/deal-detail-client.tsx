'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  Building2,
  User,
  Pencil,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: 'OPEN' | 'WON' | 'LOST';
  createdAt: string;
  updatedAt: string;
  contact?: { id: string; data?: { name?: string } };
  company?: { id: string; data?: { name?: string } };
  owner?: { id: string; name?: string; email: string };
  pipeline?: { id: string; name: string };
}

const stageConfig: Record<string, { color: string }> = {
  lead: { color: 'bg-gray-500' },
  qualified: { color: 'bg-blue-500' },
  proposal: { color: 'bg-yellow-500' },
  negotiation: { color: 'bg-orange-500' },
  closed_won: { color: 'bg-green-500' },
  closed_lost: { color: 'bg-red-500' },
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

export function DealDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dealId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'files'>('details');

  const { data: dealRecord, isLoading, error } = useQuery({
    queryKey: ['records', 'deal', dealId],
    queryFn: () => api.records.get(dealId) as Promise<{ id: string; data: Record<string, unknown>; createdAt: string; updatedAt: string }>,
    enabled: !!dealId && dealId !== '_placeholder',
  });

  // Transform record to Deal interface
  const deal: Deal | undefined = dealRecord ? {
    id: dealRecord.id,
    name: (dealRecord.data?.name as string) || 'Unnamed Deal',
    value: (dealRecord.data?.value as number) || 0,
    currency: (dealRecord.data?.currency as string) || 'USD',
    stage: (dealRecord.data?.stage as string) || 'lead',
    probability: dealRecord.data?.probability as number | undefined,
    expectedCloseDate: dealRecord.data?.expectedCloseDate as string | undefined,
    actualCloseDate: dealRecord.data?.actualCloseDate as string | undefined,
    status: (dealRecord.data?.status as 'OPEN' | 'WON' | 'LOST') || 'OPEN',
    createdAt: dealRecord.createdAt,
    updatedAt: dealRecord.updatedAt,
  } : undefined;

  const _deleteMutation = useMutation({
    mutationFn: () => api.records.delete(dealId),
    onSuccess: () => {
      toast.success(t('deals.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['records', 'deal'] });
      router.push('/deals');
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

  if (error || !deal) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f9]">
        <p className="text-gray-500">{t('deals.notFound')}</p>
        <Button onClick={() => router.push('/deals')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const stageStyle = stageConfig[deal.stage.toLowerCase()] || stageConfig.lead;
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: deal.currency || 'USD',
  }).format(deal.value);

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/deals"
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
          </div>
        </div>

        {/* Deal Info */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">{t('deals.deal')}</span>
              <Badge className={cn(stageStyle.color, 'text-white')}>{deal.stage}</Badge>
              {deal.status === 'WON' && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('deals.won')}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{deal.name}</h1>
            <p className="text-2xl font-bold text-green-600 mt-1">{formattedValue}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('deals.fields.probability')}</span>
            <span className="text-gray-900 font-medium">{deal.probability || 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('deals.fields.closeDate')}</span>
            <span className="text-gray-900">
              {deal.expectedCloseDate
                ? format(new Date(deal.expectedCloseDate), 'MMM d, yyyy')
                : '—'}
            </span>
          </div>
          {deal.company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <Link href={`/companies/${deal.company.id}`} className="text-[#0070d2] hover:underline">
                {deal.company.data?.name || t('companies.unnamed')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="sf-card">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['details', 'activities', 'files'] as const).map((tab) => (
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
                  {tab === 'details' && t('common.details')}
                  {tab === 'activities' && t('common.activities')}
                  {tab === 'files' && t('common.files')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <DetailField label={t('deals.fields.name')}>
                    <span className="text-sm text-gray-900">{deal.name}</span>
                  </DetailField>
                  <DetailField label={t('deals.fields.value')}>
                    <span className="text-sm text-gray-900 font-medium">{formattedValue}</span>
                  </DetailField>
                  <DetailField label={t('deals.fields.stage')}>
                    <Badge className={cn(stageStyle.color, 'text-white')}>{deal.stage}</Badge>
                  </DetailField>
                  <DetailField label={t('deals.fields.probability')}>
                    <span className="text-sm text-gray-900">{deal.probability || 0}%</span>
                  </DetailField>
                  <DetailField label={t('deals.fields.pipeline')}>
                    <span className="text-sm text-gray-900">
                      {deal.pipeline?.name || t('deals.defaultPipeline')}
                    </span>
                  </DetailField>
                </div>
                <div>
                  <DetailField label={t('deals.fields.closeDate')}>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {deal.expectedCloseDate
                        ? format(new Date(deal.expectedCloseDate), 'PPP')
                        : '—'}
                    </div>
                  </DetailField>
                  <DetailField label={t('companies.company')}>
                    {deal.company ? (
                      <Link
                        href={`/companies/${deal.company.id}`}
                        className="text-sm text-[#0070d2] hover:underline"
                      >
                        {deal.company.data?.name || t('companies.unnamed')}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </DetailField>
                  <DetailField label={t('contacts.contact')}>
                    {deal.contact ? (
                      <Link
                        href={`/contacts/${deal.contact.id}`}
                        className="text-sm text-[#0070d2] hover:underline"
                      >
                        {deal.contact.data?.name || t('contacts.unnamed')}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </DetailField>
                  <DetailField label={t('common.owner')}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {deal.owner?.name || deal.owner?.email || t('common.unassigned')}
                      </span>
                    </div>
                  </DetailField>
                  <DetailField label={t('common.createdAt')}>
                    <span className="text-sm text-gray-900">
                      {format(new Date(deal.createdAt), 'PPP')}
                    </span>
                  </DetailField>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('deals.noActivities')}</p>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('common.noFiles')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
