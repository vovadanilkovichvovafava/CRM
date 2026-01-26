'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { WebmasterDetailPanel } from '@/components/records/webmaster-detail-panel';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';

// Webmaster fields for affiliate CRM
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
  active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  paused: 'bg-amber-100 text-amber-700 border-amber-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
};

export default function WebmastersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWebmasterId, setSelectedWebmasterId] = useState<string | null>(null);
  const [webmastersObjectId, setWebmastersObjectId] = useState<string | null>(null);

  // Get webmasters object
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
        toast.error('Failed to load webmasters configuration. Please refresh the page.');
      } else {
        toast.error('Loading webmasters configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  // Get webmasters records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', 'webmasters', webmastersObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: webmastersObjectId!,
        search: search || undefined,
      }),
    enabled: !!webmastersObjectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success('Webmaster deleted');
      queryClient.invalidateQueries({ queryKey: ['records', 'webmasters'] });
    },
    onError: () => {
      toast.error('Failed to delete webmaster');
    },
  });

  const webmasters = (recordsData?.data as WebmasterRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!webmastersObjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('webmasters.title')}</h1>
            <p className="text-gray-600">
              {webmasters.length} webmaster{webmasters.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddWebmaster}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-sm"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {t('webmasters.addWebmaster')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('webmasters.searchWebmasters')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Webmasters Table */}
      <Card className="sf-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-gray-500">Loading webmasters...</p>
              </div>
            </div>
          ) : webmasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 mb-6 rounded-full bg-violet-50 flex items-center justify-center">
                <Globe className="h-8 w-8 text-violet-500/60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.noData')}</h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Start by adding your first webmaster partner
              </p>
              <Button
                onClick={handleAddWebmaster}
                className="bg-gradient-to-r from-violet-500 to-purple-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('webmasters.addWebmaster')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>Contact</th>
                    <th>Traffic</th>
                    <th>GEOs</th>
                    <th>{t('common.status')}</th>
                    <th>Added</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {webmasters.map((webmaster) => (
                    <tr
                      key={webmaster.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedWebmasterId(webmaster.id)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-gradient-to-br from-violet-500 to-purple-500">
                            <AvatarFallback className="text-xs text-white bg-transparent">
                              {getInitials(webmaster.data?.name || 'W')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">
                            {webmaster.data?.name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-600">
                          {webmaster.data?.telegram && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3 text-gray-400" />
                              {webmaster.data.telegram}
                            </span>
                          )}
                          {!webmaster.data?.telegram && webmaster.data?.email && (
                            <span>{webmaster.data.email}</span>
                          )}
                          {!webmaster.data?.telegram && !webmaster.data?.email && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                          {webmaster.data?.traffic_sources || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          {webmaster.data?.geos || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td>
                        {webmaster.data?.status ? (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[webmaster.data.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {webmaster.data.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-gray-500">
                        {formatRelativeTime(webmaster.createdAt)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWebmasterId(webmaster.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this webmaster?')) {
                                deleteMutation.mutate(webmaster.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Webmaster Detail Panel */}
      <WebmasterDetailPanel
        webmasterId={selectedWebmasterId}
        onClose={() => setSelectedWebmasterId(null)}
      />
    </div>
  );
}
