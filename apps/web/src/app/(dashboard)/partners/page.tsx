'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Handshake,
  Trash2,
  Eye,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  User,
  Settings,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { PartnerDetailPanel } from '@/components/records/partner-detail-panel';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime, cn } from '@/lib/utils';

const partnerFields = [
  { name: 'name', displayName: 'Partner Name', type: 'TEXT', isRequired: true },
  {
    name: 'type',
    displayName: 'Type',
    type: 'SELECT',
    isRequired: false,
    config: {
      options: [
        { value: 'CPA Network', label: 'CPA Network' },
        { value: 'Direct Advertiser', label: 'Direct Advertiser' },
        { value: 'Media Buyer', label: 'Media Buyer' },
        { value: 'Agency', label: 'Agency' },
        { value: 'Other', label: 'Other' },
      ],
    },
  },
  { name: 'website', displayName: 'Website', type: 'URL', isRequired: false },
  { name: 'manager_name', displayName: 'Manager Name', type: 'TEXT', isRequired: false },
  { name: 'manager_contact', displayName: 'Manager Contact', type: 'TEXT', isRequired: false },
  { name: 'verticals', displayName: 'Verticals', type: 'TEXT', isRequired: false },
  { name: 'geos', displayName: 'GEOs', type: 'TEXT', isRequired: false },
  { name: 'payment_terms', displayName: 'Payment Terms', type: 'TEXT', isRequired: false },
  {
    name: 'status',
    displayName: 'Status',
    type: 'SELECT',
    isRequired: false,
    config: {
      options: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  },
  { name: 'notes', displayName: 'Notes', type: 'LONG_TEXT', isRequired: false },
];

interface PartnerRecord {
  id: string;
  objectId: string;
  data: {
    name?: string;
    type?: string;
    website?: string;
    manager_name?: string;
    manager_contact?: string;
    verticals?: string;
    geos?: string;
    payment_terms?: string;
    status?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
};

const typeColors: Record<string, string> = {
  'CPA Network': 'text-pink-600',
  'Direct Advertiser': 'text-blue-600',
  'Media Buyer': 'text-violet-600',
  'Agency': 'text-green-600',
  'Other': 'text-gray-600',
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

export default function PartnersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnersObjectId, setPartnersObjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('total');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'partners'],
    queryFn: async () => {
      try {
        const result = await api.objects.getByName('partners');
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await api.objects.seedSystem();
          return await api.objects.getByName('partners');
        }
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      const id = (objectData as { id: string }).id;
      setPartnersObjectId(id);
    }
  }, [objectData]);

  const handleAddPartner = () => {
    if (!partnersObjectId) {
      if (objectError) {
        toast.error(t('errors.general'));
      } else {
        toast.error(t('common.loading'));
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['records', 'partners', partnersObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: partnersObjectId!,
        search: search || undefined,
      }),
    enabled: !!partnersObjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['records', 'partners'] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const partners = (recordsData?.data as PartnerRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!partnersObjectId);

  const metrics = useMemo(() => {
    const total = partners.length;
    const active = partners.filter(p => p.data?.status === 'active').length;
    const paused = partners.filter(p => p.data?.status === 'paused').length;
    const inactive = partners.filter(p => p.data?.status === 'inactive').length;
    const noStatus = partners.filter(p => !p.data?.status).length;
    return { total, active, paused, inactive, noStatus };
  }, [partners]);

  const filteredPartners = useMemo(() => {
    if (activeFilter === 'total') return partners;
    if (activeFilter === 'active') return partners.filter(p => p.data?.status === 'active');
    if (activeFilter === 'paused') return partners.filter(p => p.data?.status === 'paused');
    if (activeFilter === 'inactive') return partners.filter(p => p.data?.status === 'inactive');
    if (activeFilter === 'noStatus') return partners.filter(p => !p.data?.status);
    return partners;
  }, [partners, activeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchRecords();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('partners.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('partners.title')}
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

            <Button
              onClick={handleAddPartner}
              variant="outline"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              {objectLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : objectError ? (
                <AlertCircle className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('common.new')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            <Metric
              label={t('common.all')}
              value={metrics.total}
              isActive={activeFilter === 'total'}
              onClick={() => setActiveFilter('total')}
            />
            <Metric
              label={t('partners.status.active', 'Active')}
              value={metrics.active}
              isActive={activeFilter === 'active'}
              onClick={() => setActiveFilter('active')}
            />
            <Metric
              label={t('partners.status.paused', 'Paused')}
              value={metrics.paused}
              isActive={activeFilter === 'paused'}
              onClick={() => setActiveFilter('paused')}
            />
            <Metric
              label={t('partners.status.inactive', 'Inactive')}
              value={metrics.inactive}
              isActive={activeFilter === 'inactive'}
              onClick={() => setActiveFilter('inactive')}
            />
            <Metric
              label={t('partners.noStatus', 'No Status')}
              value={metrics.noStatus}
              isActive={activeFilter === 'noStatus'}
              onClick={() => setActiveFilter('noStatus')}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder={t('partners.searchPartners')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {filteredPartners.length} {t('partners.title').toLowerCase()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('contacts.sendEmail', 'Send Email')}
            </Button>
          </div>
        </div>

        <div className="sf-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Handshake className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noData')}</h3>
              <p className="text-gray-500 mb-4">
                {t('partners.noPartners', 'Add your first partner network or advertiser')}
              </p>
              <Button
                onClick={handleAddPartner}
                className="bg-[#0070d2] hover:bg-[#005fb2]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('partners.addPartner')}
              </Button>
            </div>
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('partners.type', 'Type')}</th>
                  <th>{t('partners.manager', 'Manager')}</th>
                  <th>{t('partners.verticals', 'Verticals')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.created', 'Added')}</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filteredPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white text-sm font-medium">
                          {getInitials(partner.data?.name || 'P')}
                        </div>
                        <div>
                          <Link
                            href="#"
                            className="font-medium text-[#0070d2] hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartnerId(partner.id);
                            }}
                          >
                            {partner.data?.name || 'Unnamed'}
                          </Link>
                          {partner.data?.website && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              {partner.data.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {partner.data?.type ? (
                        <span className={`text-sm font-medium ${typeColors[partner.data.type] || 'text-gray-600'}`}>
                          {partner.data.type}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {partner.data?.manager_name ? (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {partner.data.manager_name}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {partner.data?.verticals ? (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Layers className="h-3.5 w-3.5 text-pink-500" />
                          {partner.data.verticals}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {partner.data?.status ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[partner.data.status] || 'bg-gray-100 text-gray-600'}`}>
                          {partner.data.status.charAt(0).toUpperCase() + partner.data.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-gray-500">
                      {formatRelativeTime(partner.createdAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                          onClick={() => setSelectedPartnerId(partner.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => {
                            if (confirm(t('common.confirm'))) {
                              deleteMutation.mutate(partner.id);
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {partnersObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={partnersObjectId}
          objectName="Partner"
          fields={partnerFields}
        />
      )}

      {/* Partner Detail Panel */}
      <PartnerDetailPanel
        partnerId={selectedPartnerId}
        onClose={() => setSelectedPartnerId(null)}
      />
    </div>
  );
}
