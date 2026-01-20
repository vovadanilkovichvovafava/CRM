'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { KanbanBoard, KanbanStage, KanbanItem } from '@/components/kanban';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { SlideOver } from '@/components/ui/slide-over';
import { EditRecordModal } from '@/components/records/edit-record-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';

// Deal fields configuration
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

interface Pipeline {
  id: string;
  name: string;
  stages: KanbanStage[];
}

const defaultStages: KanbanStage[] = [
  { id: 'lead', name: 'Lead', color: '#6B7280', position: 0 },
  { id: 'qualified', name: 'Qualified', color: '#3B82F6', position: 1 },
  { id: 'proposal', name: 'Proposal', color: '#F59E0B', position: 2 },
  { id: 'negotiation', name: 'Negotiation', color: '#8B5CF6', position: 3 },
  { id: 'closed_won', name: 'Closed Won', color: '#10B981', position: 4 },
  { id: 'closed_lost', name: 'Closed Lost', color: '#EF4444', position: 5 },
];

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dealsObjectId, setDealsObjectId] = useState<string | null>(null);
  const [stages, setStages] = useState<KanbanStage[]>(defaultStages);

  // Get deals object
  const { data: objectData, isLoading: objectLoading } = useQuery({
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
  });

  useEffect(() => {
    if (objectData) {
      const objId = (objectData as { id: string }).id;
      setDealsObjectId(objId);
    }
  }, [objectData]);

  // Get pipeline for deals
  const { data: pipelinesData } = useQuery({
    queryKey: ['pipelines', dealsObjectId],
    queryFn: () => api.pipelines.listByObject(dealsObjectId!) as Promise<Pipeline[]>,
    enabled: !!dealsObjectId,
  });

  useEffect(() => {
    if (pipelinesData && pipelinesData.length > 0) {
      const defaultPipeline = pipelinesData.find(p => (p as unknown as { isDefault: boolean }).isDefault) || pipelinesData[0];
      if (defaultPipeline?.stages) {
        setStages(defaultPipeline.stages);
      }
    }
  }, [pipelinesData]);

  // Get deal records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', 'deals', dealsObjectId],
    queryFn: () =>
      api.records.list({
        objectId: dealsObjectId!,
      }),
    enabled: !!dealsObjectId,
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.records.update(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', 'deals'] });
    },
    onError: () => {
      toast.error('Failed to move deal');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success('Deal deleted');
      queryClient.invalidateQueries({ queryKey: ['records', 'deals'] });
      setSelectedDeal(null);
    },
    onError: () => {
      toast.error('Failed to delete deal');
    },
  });

  const deals = (recordsData?.data as DealRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!dealsObjectId);

  // Calculate totals
  const totalValue = deals.reduce((sum, deal) => sum + (deal.data?.value || 0), 0);
  const wonValue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, deal) => sum + (deal.data?.value || 0), 0);

  const handleDealMove = (dealId: string, targetStage: string) => {
    updateStageMutation.mutate({ id: dealId, stage: targetStage });
    toast.success(`Deal moved to ${stages.find((s) => s.id === targetStage)?.name}`);
  };

  const handleDealClick = (item: KanbanItem) => {
    const deal = deals.find((d) => d.id === item.id);
    if (deal) {
      setSelectedDeal(deal);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Deals</h1>
              <p className="text-sm text-white/50">
                {deals.length} deal{deals.length !== 1 ? 's' : ''} · {formatCurrency(totalValue)} total
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          disabled={!dealsObjectId}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Pipeline Value</p>
                <p className="text-xl font-bold text-white">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Won Value</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Active Deals</p>
                <p className="text-xl font-bold text-white">
                  {deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        stages={stages}
        items={deals.map((deal) => ({
          id: deal.id,
          stage: deal.stage,
          data: deal.data,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
        }))}
        onItemMove={handleDealMove}
        onItemClick={handleDealClick}
        titleField="name"
        subtitleField="company"
        valueField="value"
      />

      {/* Create Modal */}
      {dealsObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={dealsObjectId}
          objectName="Deal"
          fields={dealFields}
        />
      )}

      {/* Deal Detail Panel */}
      <SlideOver
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        width="lg"
      >
        {selectedDeal && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-500">
                  <AvatarFallback className="text-xl text-white bg-transparent">
                    {getInitials(selectedDeal.data.name || 'D')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedDeal.data.name || 'Unnamed Deal'}
                  </h1>
                  {selectedDeal.data.company && (
                    <p className="text-white/50">{selectedDeal.data.company}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <p className="text-sm text-green-400/70">Deal Value</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(selectedDeal.data.value || 0)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="border-white/10"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this deal?')) {
                    deleteMutation.mutate(selectedDeal.id);
                  }
                }}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                Delete
              </Button>
            </div>

            {/* Details */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDeal.data.contact && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Contact</p>
                    <p className="text-white">{selectedDeal.data.contact}</p>
                  </div>
                )}
                {selectedDeal.data.expectedCloseDate && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Expected Close</p>
                    <p className="text-white">{selectedDeal.data.expectedCloseDate}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Stage</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          stages.find((s) => s.id === selectedDeal.stage)?.color || '#6B7280',
                      }}
                    />
                    <p className="text-white">
                      {stages.find((s) => s.id === selectedDeal.stage)?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Created</p>
                  <p className="text-white">{formatRelativeTime(selectedDeal.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {selectedDeal.data.notes && (
              <Card className="bg-white/[0.02] border-white/[0.05]">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 whitespace-pre-wrap">{selectedDeal.data.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SlideOver>

      {/* Edit Modal */}
      {selectedDeal && (
        <EditRecordModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          record={selectedDeal}
          objectName="Deal"
          fields={dealFields}
        />
      )}
    </div>
  );
}
