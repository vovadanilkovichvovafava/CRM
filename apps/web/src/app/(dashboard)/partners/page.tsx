'use client';

import { useState, useEffect } from 'react';
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
  MapPin,
  Layers,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { PartnerDetailPanel } from '@/components/records/partner-detail-panel';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';

// Partner fields for affiliate CRM
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
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const typeColors: Record<string, string> = {
  'CPA Network': 'text-pink-400',
  'Direct Advertiser': 'text-blue-400',
  'Media Buyer': 'text-violet-400',
  'Agency': 'text-emerald-400',
  'Other': 'text-white/60',
};

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnersObjectId, setPartnersObjectId] = useState<string | null>(null);

  // Get partners object
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
        toast.error('Failed to load partners configuration. Please refresh the page.');
      } else {
        toast.error('Loading partners configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  // Get partners records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', 'partners', partnersObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: partnersObjectId!,
        search: search || undefined,
      }),
    enabled: !!partnersObjectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success('Partner deleted');
      queryClient.invalidateQueries({ queryKey: ['records', 'partners'] });
    },
    onError: () => {
      toast.error('Failed to delete partner');
    },
  });

  const partners = (recordsData?.data as PartnerRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!partnersObjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Partners</h1>
              <p className="text-sm text-white/50">
                {partners.length} partner{partners.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAddPartner}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Partner
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button variant="outline" size="icon" className="border-white/10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Partners Table */}
      <Card className="bg-white/[0.02] border-white/[0.05]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Handshake className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No partners yet</h3>
              <p className="text-sm text-white/50 mb-4">
                Add your first partner network or advertiser
              </p>
              <Button
                onClick={handleAddPartner}
                className="bg-gradient-to-r from-pink-500 to-rose-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Verticals
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
                  {partners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedPartnerId(partner.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-gradient-to-br from-pink-500 to-rose-500">
                            <AvatarFallback className="text-xs text-white bg-transparent">
                              {getInitials(partner.data?.name || 'P')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-white block">
                              {partner.data?.name || 'Unnamed'}
                            </span>
                            {partner.data?.website && (
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                {partner.data.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {partner.data?.type ? (
                          <span className={`text-sm ${typeColors[partner.data.type] || 'text-white/60'}`}>
                            {partner.data.type}
                          </span>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {partner.data?.manager_name ? (
                          <div className="flex items-center gap-1 text-sm text-white/60">
                            <User className="h-3 w-3" />
                            {partner.data.manager_name}
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {partner.data?.verticals ? (
                          <div className="flex items-center gap-1 text-sm text-white/60">
                            <Layers className="h-3 w-3 text-pink-400" />
                            {partner.data.verticals}
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {partner.data?.status ? (
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[partner.data.status] || 'bg-white/10 text-white/60'}`}>
                            {partner.data.status}
                          </span>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">
                        {formatRelativeTime(partner.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartnerId(partner.id);
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
                              if (confirm('Delete this partner?')) {
                                deleteMutation.mutate(partner.id);
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
