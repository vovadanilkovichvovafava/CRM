'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dealsObjectId, setDealsObjectId] = useState<string | null>(null);
  const [stages, setStages] = useState<KanbanStage[]>(defaultStages);

  // Get deals object
  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'deals'],
    queryFn: async () => {
      try {
        const result = await api.objects.getByName('deals');
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          console.log('Deals object not found, seeding system objects...');
          await api.objects.seedSystem();
          return await api.objects.getByName('deals');
        }
        console.error('Error fetching deals object:', error);
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      const objId = (objectData as { id: string }).id;
      console.log('Deals object loaded:', objId);
      setDealsObjectId(objId);
    }
  }, [objectData]);

  // Handle add deal click - show error if object not loaded
  const handleAddDeal = () => {
    if (!dealsObjectId) {
      if (objectError) {
        toast.error('Failed to load deals configuration. Please refresh the page.');
        console.error('Object error:', objectError);
      } else {
        toast.error('Loading deals configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

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
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('deals.title')}</h1>
            <p className="text-gray-600">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} · {formatCurrency(totalValue)} total
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddDeal}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-sm"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {t('deals.addDeal')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="sf-card border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sf-card border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Won Value</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sf-card border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">
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
          defaultStage="lead"
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedDeal.data.name || 'Unnamed Deal'}
                  </h1>
                  {selectedDeal.data.company && (
                    <p className="text-gray-600">{selectedDeal.data.company}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <p className="text-sm font-medium text-green-700">Deal Value</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(selectedDeal.data.value || 0)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
              >
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this deal?')) {
                    deleteMutation.mutate(selectedDeal.id);
                  }
                }}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                {t('common.delete')}
              </Button>
            </div>

            {/* Details */}
            <Card className="sf-card">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg text-gray-900">{t('common.details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {selectedDeal.data.contact && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('deals.fields.contact')}</p>
                    <p className="text-gray-900 mt-1">{selectedDeal.data.contact}</p>
                  </div>
                )}
                {selectedDeal.data.expectedCloseDate && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('deals.fields.closeDate')}</p>
                    <p className="text-gray-900 mt-1">{selectedDeal.data.expectedCloseDate}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('deals.fields.stage')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          stages.find((s) => s.id === selectedDeal.stage)?.color || '#6B7280',
                      }}
                    />
                    <p className="text-gray-900 font-medium">
                      {stages.find((s) => s.id === selectedDeal.stage)?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                  <p className="text-gray-900 mt-1">{formatRelativeTime(selectedDeal.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {selectedDeal.data.notes && (
              <Card className="sf-card">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-900">{t('contacts.fields.notes')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedDeal.data.notes}</p>
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
