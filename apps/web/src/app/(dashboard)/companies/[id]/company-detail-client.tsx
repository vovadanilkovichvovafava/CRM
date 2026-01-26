'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  Pencil,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

interface CompanyData {
  name?: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  employees?: number;
  revenue?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
}

interface CompanyRecord {
  id: string;
  objectId: string;
  data: CompanyData;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number | null;
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

export function CompanyDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'deals'>('details');

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['records', 'company', companyId],
    queryFn: () => api.records.get(companyId) as Promise<CompanyRecord>,
    enabled: !!companyId && companyId !== '_placeholder',
  });

  const _deleteMutation = useMutation({
    mutationFn: () => api.records.delete(companyId),
    onSuccess: () => {
      toast.success(t('companies.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
      router.push('/companies');
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

  if (error || !company) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f9]">
        <p className="text-gray-500">{t('companies.notFound')}</p>
        <Button onClick={() => router.push('/companies')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const data = company.data || {};
  const displayName = data.name || t('companies.unnamed');
  const ownerName = company.owner?.name || t('common.unknown');

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/companies"
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

        {/* Company Info */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-semibold">
            {getInitials(displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('companies.company')}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            {data.industry && (
              <p className="text-sm text-gray-500 mt-1">{data.industry}</p>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('companies.fields.website')}</span>
            {data.website ? (
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-[#0070d2] hover:underline">
                {data.website}
              </a>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{data.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{t('companies.fields.employees')}</span>
            <span className="text-gray-900">{data.employees || '—'}</span>
          </div>
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
              {(['details', 'contacts', 'deals'] as const).map((tab) => (
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
                  {tab === 'contacts' && t('contacts.title')}
                  {tab === 'deals' && t('deals.title')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <DetailField label={t('common.owner')} value={ownerName} />
                  <DetailField label={t('companies.fields.name')} value={displayName} />
                  <DetailField
                    label={t('companies.fields.website')}
                    value={data.website}
                    icon={data.website && <Globe className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField label={t('companies.fields.industry')} value={data.industry} />
                  <DetailField label={t('companies.fields.employees')} value={data.employees} />
                  <DetailField label={t('companies.fields.revenue')} value={data.revenue} />
                </div>
                <div>
                  <DetailField
                    label={t('companies.fields.phone')}
                    value={data.phone}
                    icon={data.phone && <Phone className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField
                    label={t('companies.fields.email')}
                    value={data.email}
                    icon={data.email && <Mail className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField
                    label={t('companies.fields.address')}
                    value={data.address}
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  />
                  <DetailField label={t('companies.fields.city')} value={data.city} />
                  <DetailField label={t('companies.fields.country')} value={data.country} />
                </div>
                {data.description && (
                  <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <DetailField label={t('common.description')} value={data.description} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('companies.noContacts')}</p>
                <Button className="mt-4" variant="outline">
                  {t('contacts.add')}
                </Button>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('companies.noDeals')}</p>
                <Button className="mt-4" variant="outline">
                  {t('deals.add')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
