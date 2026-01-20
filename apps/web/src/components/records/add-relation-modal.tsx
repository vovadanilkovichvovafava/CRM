'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Check, Building2, User, DollarSign, Globe, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AddRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  currentObjectName: string;
}

interface ObjectInfo {
  id: string;
  name: string;
  displayName: string;
  icon: string | null;
  color: string | null;
}

interface RecordInfo {
  id: string;
  objectId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// Icon mapping for object types
const objectIcons: Record<string, React.ElementType> = {
  contacts: User,
  companies: Building2,
  deals: DollarSign,
  webmasters: Globe,
  partners: Handshake,
};

// Color mapping for object types
const objectColors: Record<string, string> = {
  contacts: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  companies: 'bg-green-500/10 text-green-400 border-green-500/30',
  deals: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  webmasters: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  partners: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

// Get display name from record data
function getRecordDisplayName(data: Record<string, unknown>): string {
  return (
    (data.name as string) ||
    (data.title as string) ||
    (data.email as string) ||
    'Unnamed'
  );
}

export function AddRelationModal({
  isOpen,
  onClose,
  recordId,
  currentObjectName,
}: AddRelationModalProps) {
  const queryClient = useQueryClient();
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedObjectType(null);
      setSearchQuery('');
      setSelectedRecordId(null);
    }
  }, [isOpen]);

  // Fetch available object types
  const { data: objectsData } = useQuery({
    queryKey: ['objects'],
    queryFn: () => api.objects.list(),
    enabled: isOpen,
  });

  const objects = (objectsData?.data || []) as ObjectInfo[];

  // Fetch records for selected object type
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', { objectId: selectedObjectType, search: searchQuery }],
    queryFn: () =>
      api.records.list({
        objectId: selectedObjectType!,
        search: searchQuery || undefined,
        limit: 20,
      }),
    enabled: !!selectedObjectType,
  });

  const records = ((recordsData?.data || []) as RecordInfo[]).filter(
    (r) => r.id !== recordId, // Exclude current record
  );

  // Fetch existing relations to show which are already linked
  const { data: existingRelations } = useQuery({
    queryKey: ['relations', recordId],
    queryFn: () => api.relations.listByRecord(recordId),
    enabled: isOpen,
  });

  const linkedRecordIds = new Set(
    (existingRelations || []).flatMap((r) => [r.fromRecordId, r.toRecordId]),
  );

  // Create relation mutation
  const createMutation = useMutation({
    mutationFn: (toRecordId: string) => {
      // Determine relation type based on target object
      const targetObject = objects.find((o) => o.id === selectedObjectType);
      const relationType = targetObject?.name || 'related';

      return api.relations.create({
        fromRecordId: recordId,
        toRecordId,
        relationType,
      });
    },
    onSuccess: () => {
      toast.success('Relation added');
      queryClient.invalidateQueries({ queryKey: ['relations', recordId] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const message = (err.data as { message?: string })?.message || 'Failed to add relation';
        toast.error(message);
      }
    },
  });

  const handleAddRelation = () => {
    if (selectedRecordId) {
      createMutation.mutate(selectedRecordId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Relation" className="max-w-2xl">
      <div className="space-y-6">
        {/* Step 1: Select Object Type */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            1. Select object type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {objects.map((obj) => {
              const Icon = objectIcons[obj.name] || Building2;
              const colorClass = objectColors[obj.name] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
              const isSelected = selectedObjectType === obj.id;

              return (
                <button
                  key={obj.id}
                  onClick={() => {
                    setSelectedObjectType(obj.id);
                    setSelectedRecordId(null);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-all',
                    'hover:bg-white/[0.05]',
                    isSelected
                      ? cn(colorClass, 'border-2')
                      : 'bg-white/[0.02] border-white/10',
                  )}
                >
                  <Icon className={cn('h-5 w-5', isSelected ? '' : 'text-white/40')} />
                  <span className={cn('text-sm font-medium', isSelected ? '' : 'text-white')}>
                    {obj.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Search and Select Record */}
        {selectedObjectType && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              2. Select record
            </label>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] border-white/10"
              />
            </div>

            {/* Records List */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]">
              {recordsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">
                  No records found
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {records.map((record) => {
                    const isLinked = linkedRecordIds.has(record.id);
                    const isSelected = selectedRecordId === record.id;
                    const displayName = getRecordDisplayName(record.data);

                    return (
                      <button
                        key={record.id}
                        onClick={() => !isLinked && setSelectedRecordId(record.id)}
                        disabled={isLinked}
                        className={cn(
                          'w-full flex items-center justify-between p-3 text-left transition-colors',
                          isLinked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-white/[0.05] cursor-pointer',
                          isSelected && 'bg-indigo-500/10',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{displayName}</p>
                          {typeof record.data.email === 'string' && (
                            <p className="text-xs text-white/40 truncate">
                              {record.data.email}
                            </p>
                          )}
                        </div>
                        {isLinked ? (
                          <span className="text-xs text-white/30 ml-2">Already linked</span>
                        ) : isSelected ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="border-white/10">
            Cancel
          </Button>
          <Button
            onClick={handleAddRelation}
            disabled={!selectedRecordId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Relation'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
