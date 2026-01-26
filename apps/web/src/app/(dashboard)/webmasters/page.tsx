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
  Globe,
  Trash2,
  Eye,
  AlertCircle,
  Send,
  MapPin,
  TrendingUp,
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
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime, cn } from '@/lib/utils';

const webmasterFields = [
  { name: 'name', displayName: 'Name', type: 'TEXT', isRequired: true },
  { name: 'email', displayName: 'Email', type: 'EMAIL', isRequired: false },
  { name: 'telegram', displayName: 'Telegram', type: 'TEXT', isRequired: false },
  { name: 'skype', displayName: 'Skype', type: 'TEXT', isRequired: false },
  { name: 'traffic_sources', displayName: 'Traffic Sources', type: 'TEXT', isRequired: false },
  { name: 'geos', displayName: 'GEOs', type: 'TEXT', isRequired: false },
  { name: 'verticals', displayName: 'Verticals', type: 'TEXT', isRequired: false },
  {
    name: 'status',
    displayName: 'Status',
    type: 'SELECT',
    isRequired: false,
    config: {
      options: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'blocked', label: 'Blocked' },
      ],
    },
  },
  { name: 'notes', displayName: 'Notes', type: 'LONG_TEXT', isRequired: false },
];

interface WebmasterRecord {
  id: string;
  objectId: string;
  data: {
    name?: string;
    email?: string;
    telegram?: string;
    skype?: string;
    traffic_sources?: string;
    geos?: string;
    verticals?: string;
    status?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',
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

export default function WebmastersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [webmastersObjectId, setWebmastersObjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('total');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'webmasters'],
    queryFn: async () => {
      try {
        const result = await api.objects.getByName('webmasters');
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await api.objects.seedSystem();
          return await api.objects.getByName('webmasters');
        }
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      const id = (objectData as { id: string }).id;
      setWebmastersObjectId(id);
    }
  }, [objectData]);

  const handleAddWebmaster = () => {
    if (!webmastersObjectId) {
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
    queryKey: ['records', 'webmasters', webmastersObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: webmastersObjectId!,
        search: search || undefined,
      }),
    enabled: !!webmastersObjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['records', 'webmasters'] });
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  const webmasters = (recordsData?.data as WebmasterRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!webmastersObjectId);

  const metrics = useMemo(() => {
    const total = webmasters.length;
    const active = webmasters.filter(w => w.data?.status === 'active').length;
    const paused = webmasters.filter(w => w.data?.status === 'paused').length;
    const blocked = webmasters.filter(w => w.data?.status === 'blocked').length;
    const noStatus = webmasters.filter(w => !w.data?.status).length;
    return { total, active, paused, blocked, noStatus };
  }, [webmasters]);

  const filteredWebmasters = useMemo(() => {
    if (activeFilter === 'total') return webmasters;
    if (activeFilter === 'active') return webmasters.filter(w => w.data?.status === 'active');
    if (activeFilter === 'paused') return webmasters.filter(w => w.data?.status === 'paused');
    if (activeFilter === 'blocked') return webmasters.filter(w => w.data?.status === 'blocked');
    if (activeFilter === 'noStatus') return webmasters.filter(w => !w.data?.status);
    return webmasters;
  }, [webmasters, activeFilter]);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('webmasters.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('webmasters.title')}
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
              onClick={handleAddWebmaster}
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
              label={t('webmasters.status.active', 'Active')}
              value={metrics.active}
              isActive={activeFilter === 'active'}
              onClick={() => setActiveFilter('active')}
            />
            <Metric
              label={t('webmasters.status.paused', 'Paused')}
              value={metrics.paused}
              isActive={activeFilter === 'paused'}
              onClick={() => setActiveFilter('paused')}
            />
            <Metric
              label={t('webmasters.status.blocked', 'Blocked')}
              value={metrics.blocked}
              isActive={activeFilter === 'blocked'}
              onClick={() => setActiveFilter('blocked')}
            />
            <Metric
              label={t('webmasters.noStatus', 'No Status')}
              value={metrics.noStatus}
              isActive={activeFilter === 'noStatus'}
              onClick={() => setActiveFilter('noStatus')}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder={t('webmasters.searchWebmasters')}
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
            {filteredWebmasters.length} {t('webmasters.title').toLowerCase()}
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
          ) : filteredWebmasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noData')}</h3>
              <p className="text-gray-500 mb-4">
                {t('webmasters.noWebmasters', 'Start by adding your first webmaster partner')}
              </p>
              <Button
                onClick={handleAddWebmaster}
                className="bg-[#0070d2] hover:bg-[#005fb2]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('webmasters.addWebmaster')}
              </Button>
            </div>
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('webmasters.contact', 'Contact')}</th>
                  <th>{t('webmasters.traffic', 'Traffic')}</th>
                  <th>{t('webmasters.geos', 'GEOs')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.created', 'Added')}</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filteredWebmasters.map((webmaster) => (
                  <tr
                    key={webmaster.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/webmasters/${webmaster.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
                          {getInitials(webmaster.data?.name || 'W')}
                        </div>
                        <Link
                          href={`/webmasters/${webmaster.id}`}
                          className="font-medium text-[#0070d2] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {webmaster.data?.name || 'Unnamed'}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-600">
                        {webmaster.data?.telegram ? (
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3 text-gray-400" />
                            {webmaster.data.telegram}
                          </span>
                        ) : webmaster.data?.email ? (
                          <span>{webmaster.data.email}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                        {webmaster.data?.traffic_sources || <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="h-3.5 w-3.5 text-green-500" />
                        {webmaster.data?.geos || <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td>
                      {webmaster.data?.status ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[webmaster.data.status] || 'bg-gray-100 text-gray-600'}`}>
                          {webmaster.data.status.charAt(0).toUpperCase() + webmaster.data.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-gray-500">
                      {formatRelativeTime(webmaster.createdAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                          onClick={() => router.push(`/webmasters/${webmaster.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => {
                            if (confirm(t('common.confirm'))) {
                              deleteMutation.mutate(webmaster.id);
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
      {webmastersObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={webmastersObjectId}
          objectName="Webmaster"
          fields={webmasterFields}
        />
      )}
    </div>
  );
}
