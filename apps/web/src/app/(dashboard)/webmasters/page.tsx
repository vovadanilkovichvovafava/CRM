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
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function WebmastersPage() {
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
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Webmasters</h1>
              <p className="text-sm text-white/50">
                {webmasters.length} webmaster{webmasters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAddWebmaster}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Webmaster
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search webmasters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button variant="outline" size="icon" className="border-white/10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Webmasters Table */}
      <Card className="bg-white/[0.02] border-white/[0.05]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : webmasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No webmasters yet</h3>
              <p className="text-sm text-white/50 mb-4">
                Start by adding your first webmaster partner
              </p>
              <Button
                onClick={handleAddWebmaster}
                className="bg-gradient-to-r from-violet-500 to-purple-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Webmaster
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Traffic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      GEOs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {webmasters.map((webmaster) => (
                    <tr
                      key={webmaster.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedWebmasterId(webmaster.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-500">
                            <AvatarFallback className="text-xs text-white bg-transparent">
                              {getInitials(webmaster.data?.name || 'W')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white">
                            {webmaster.data?.name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          {webmaster.data?.telegram && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              {webmaster.data.telegram}
                            </span>
                          )}
                          {!webmaster.data?.telegram && webmaster.data?.email && (
                            <span>{webmaster.data.email}</span>
                          )}
                          {!webmaster.data?.telegram && !webmaster.data?.email && '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <TrendingUp className="h-3 w-3 text-violet-400" />
                          {webmaster.data?.traffic_sources || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {webmaster.data?.geos || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {webmaster.data?.status ? (
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[webmaster.data.status] || 'bg-white/10 text-white/60'}`}>
                            {webmaster.data.status}
                          </span>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">
                        {formatRelativeTime(webmaster.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
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
                            className="h-8 w-8 text-white/40 hover:text-red-400"
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
