'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  Pencil,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

interface WebmasterData {
  name?: string;
  website?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  traffic?: string;
  geos?: string[];
  verticals?: string[];
  status?: string;
  notes?: string;
}

interface WebmasterRecord {
  id: string;
  objectId: string;
  data: WebmasterData;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

const statusConfig: Record<string, { color: string }> = {
  active: { color: 'bg-green-500 text-white' },
  inactive: { color: 'bg-gray-500 text-white' },
  pending: { color: 'bg-yellow-500 text-white' },
  blocked: { color: 'bg-red-500 text-white' },
};

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-1/3 flex-shrink-0">
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        {icon}
        {value ? (
          <span className="text-sm text-gray-900">{value}</span>
        ) : (
          <span className="text-sm text-gray-400 italic">—</span>
        )}
      </div>
    </div>
  );
}

export function WebmasterDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const webmasterId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'stats'>('details');

  const { data: webmaster, isLoading, error } = useQuery({
    queryKey: ['records', 'webmaster', webmasterId],
    queryFn: () => api.records.get(webmasterId) as Promise<WebmasterRecord>,
    enabled: !!webmasterId && webmasterId !== '_placeholder',
  });

  const _deleteMutation = useMutation({
    mutationFn: () => api.records.delete(webmasterId),
    onSuccess: () => {
      toast.success(t('webmasters.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
      router.push('/webmasters');
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

  if (error || !webmaster) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f9]">
        <p className="text-gray-500">{t('webmasters.notFound')}</p>
        <Button onClick={() => router.push('/webmasters')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const data = webmaster.data || {};
  const displayName = data.name || t('webmasters.unnamed');
  const ownerName = webmaster.owner?.name || t('common.unknown');
  const status = data.status?.toLowerCase() || 'pending';
  const statusStyle = statusConfig[status] || statusConfig.pending;

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/webmasters"
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

        {/* Webmaster Info */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-lg font-semibold">
            {getInitials(displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">{t('webmasters.webmaster')}</span>
              <Badge className={statusStyle.color}>{data.status || 'Pending'}</Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          </div>
        </div>

        {/* Quick Info */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            {data.website ? (
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-[#0070d2] hover:underline">
                {data.website}
              </a>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('webmasters.fields.traffic')}</span>
            <span className="text-gray-900">{data.traffic || '—'}</span>
          </div>
          {data.geos && data.geos.length > 0 && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{data.geos.join(', ')}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t('common.owner')}</span>
            <Link href="#" className="ml-2 text-[#0070d2] hover:underline flex items-center gap-1">
              {ownerName}
              <Share2 className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="sf-card">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['details', 'offers', 'stats'] as const).map((tab) => (
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
                  {tab === 'offers' && t('webmasters.offers')}
                  {tab === 'stats' && t('webmasters.stats')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <DetailField label={t('common.owner')} value={ownerName} />
                  <DetailField label={t('webmasters.fields.name')} value={displayName} />
                  <DetailField
                    label={t('webmasters.fields.website')}
                    value={data.website}
                    icon={<Globe className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField
                    label={t('webmasters.fields.email')}
                    value={data.email}
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField
                    label={t('webmasters.fields.phone')}
                    value={data.phone}
                    icon={<Phone className="h-4 w-4 text-gray-400" />}
                  />
                </div>
                <div>
                  <DetailField label={t('webmasters.fields.telegram')} value={data.telegram} />
                  <DetailField label={t('webmasters.fields.traffic')} value={data.traffic} />
                  <DetailField label={t('webmasters.fields.geos')} value={data.geos?.join(', ')} />
                  <DetailField label={t('webmasters.fields.verticals')} value={data.verticals?.join(', ')} />
                  <DetailField label={t('webmasters.fields.status')} value={data.status} />
                </div>
                {data.notes && (
                  <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <DetailField label={t('common.notes')} value={data.notes} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('webmasters.noOffers')}</p>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('webmasters.noStats')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
