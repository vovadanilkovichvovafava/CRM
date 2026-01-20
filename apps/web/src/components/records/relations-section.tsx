'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Link as LinkIcon,
  Plus,
  X,
  Building2,
  User,
  DollarSign,
  Globe,
  Handshake,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AddRelationModal } from './add-relation-modal';

interface RelationRecord {
  id: string;
  fromRecordId: string;
  toRecordId: string;
  relationType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  fromRecord: {
    id: string;
    objectId: string;
    data: Record<string, unknown>;
    object: {
      id: string;
      name: string;
      displayName: string;
      icon: string | null;
      color: string | null;
    };
  };
  toRecord: {
    id: string;
    objectId: string;
    data: Record<string, unknown>;
    object: {
      id: string;
      name: string;
      displayName: string;
      icon: string | null;
      color: string | null;
    };
  };
}

interface RelationsSectionProps {
  recordId: string;
  currentObjectName: string;
  onRecordClick?: (recordId: string, objectName: string) => void;
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
  contacts: 'bg-blue-500/10 text-blue-400',
  companies: 'bg-green-500/10 text-green-400',
  deals: 'bg-amber-500/10 text-amber-400',
  webmasters: 'bg-purple-500/10 text-purple-400',
  partners: 'bg-pink-500/10 text-pink-400',
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

// Get secondary info from record data
function getRecordSecondaryInfo(data: Record<string, unknown>, objectName: string): string | null {
  if (objectName === 'contacts') {
    return (data.company as string) || (data.email as string) || null;
  }
  if (objectName === 'companies') {
    return (data.industry as string) || (data.website as string) || null;
  }
  if (objectName === 'deals') {
    const value = data.value as number | undefined;
    return value ? `$${value.toLocaleString()}` : null;
  }
  return null;
}

export function RelationsSection({
  recordId,
  currentObjectName,
  onRecordClick,
}: RelationsSectionProps) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch relations for this record
  const { data: relations, isLoading } = useQuery({
    queryKey: ['relations', recordId],
    queryFn: () => api.relations.listByRecord(recordId),
    enabled: !!recordId,
  });

  // Delete relation mutation
  const deleteMutation = useMutation({
    mutationFn: (relationId: string) => api.relations.delete(relationId),
    onSuccess: () => {
      toast.success('Relation removed');
      queryClient.invalidateQueries({ queryKey: ['relations', recordId] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to remove relation');
      }
    },
  });

  // Group relations by object type
  const groupedRelations = (relations || []).reduce<Record<string, RelationRecord[]>>(
    (acc, relation) => {
      // Determine which record is the "other" one (not the current record)
      const otherRecord =
        relation.fromRecordId === recordId ? relation.toRecord : relation.fromRecord;
      const objectName = otherRecord.object.name;

      if (!acc[objectName]) {
        acc[objectName] = [];
      }
      acc[objectName].push(relation);
      return acc;
    },
    {},
  );

  const handleRemoveRelation = (relationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this relation?')) {
      deleteMutation.mutate(relationId);
    }
  };

  const handleRecordClick = (relation: RelationRecord) => {
    const otherRecord =
      relation.fromRecordId === recordId ? relation.toRecord : relation.fromRecord;
    if (onRecordClick) {
      onRecordClick(otherRecord.id, otherRecord.object.name);
    }
  };

  return (
    <>
      <Card className="bg-white/[0.02] border-white/[0.05]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-white/40" />
            Relations
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : !relations || relations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-white/30 mb-3">No relations yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="border-white/10 hover:border-white/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Relation
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRelations).map(([objectName, objectRelations]) => {
                const Icon = objectIcons[objectName] || LinkIcon;
                const colorClass = objectColors[objectName] || 'bg-gray-500/10 text-gray-400';
                const displayName =
                  objectRelations[0]?.fromRecord.object.name === objectName
                    ? objectRelations[0].fromRecord.object.displayName
                    : objectRelations[0]?.toRecord.object.displayName || objectName;

                return (
                  <div key={objectName}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded',
                          colorClass,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-white/70">
                        {displayName} ({objectRelations.length})
                      </span>
                    </div>

                    <div className="space-y-2 ml-8">
                      {objectRelations.map((relation) => {
                        const otherRecord =
                          relation.fromRecordId === recordId
                            ? relation.toRecord
                            : relation.fromRecord;
                        const displayNameValue = getRecordDisplayName(otherRecord.data);
                        const secondaryInfo = getRecordSecondaryInfo(
                          otherRecord.data,
                          objectName,
                        );

                        return (
                          <div
                            key={relation.id}
                            className={cn(
                              'group flex items-center justify-between p-2 rounded-lg',
                              'bg-white/[0.02] hover:bg-white/[0.05] transition-colors',
                              onRecordClick && 'cursor-pointer',
                            )}
                            onClick={() => handleRecordClick(relation)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{displayNameValue}</p>
                              {secondaryInfo && (
                                <p className="text-xs text-white/40 truncate">{secondaryInfo}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleRemoveRelation(relation.id, e)}
                              disabled={deleteMutation.isPending}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddRelationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        recordId={recordId}
        currentObjectName={currentObjectName}
      />
    </>
  );
}
