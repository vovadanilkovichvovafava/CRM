'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Activity,
  Handshake,
  MapPin,
  Layers,
  User,
  Link as LinkIcon,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SlideOver } from '@/components/ui/slide-over';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { EditRecordModal } from '@/components/records/edit-record-modal';
import { RelationsSection } from '@/components/records/relations-section';
import { CommentSection } from '@/components/comments/comment-section';
import { FileSection } from '@/components/files/file-section';

// Partner fields configuration
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

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

interface PartnerDetailPanelProps {
  partnerId: string | null;
  onClose: () => void;
}

export function PartnerDetailPanel({ partnerId, onClose }: PartnerDetailPanelProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Get partner record
  const { data: partner, isLoading, error } = useQuery({
    queryKey: ['records', partnerId],
    queryFn: () => api.records.get(partnerId!) as Promise<PartnerRecord>,
    enabled: !!partnerId,
  });

  // Get activity timeline
  const { data: activities } = useQuery({
    queryKey: ['activities', partnerId],
    queryFn: () => api.activities.getTimeline(partnerId!, 10) as Promise<ActivityItem[]>,
    enabled: !!partnerId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.records.delete(partnerId!),
    onSuccess: () => {
      toast.success('Partner deleted');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete partner');
      }
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const data = partner?.data || {};

  return (
    <>
      <SlideOver isOpen={!!partnerId} onClose={onClose} width="lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : error || !partner ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-white/50 mb-4">Partner not found</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-pink-500 to-rose-500">
                  <AvatarFallback className="text-xl text-white bg-transparent">
                    {getInitials(data.name || 'P')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">{data.name || 'Unnamed Partner'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {data.type && (
                      <span className="text-sm text-pink-400">{data.type}</span>
                    )}
                    {data.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[data.status] || 'bg-white/10 text-white/60'}`}>
                        {data.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="border-white/10"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {data.website && (
                <Button
                  variant="outline"
                  asChild
                  className="border-white/10"
                >
                  <a href={data.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Website
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>

            {/* Partner Info Card */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Partner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Website */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <LinkIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Website</p>
                    {data.website ? (
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-pink-400 transition-colors"
                      >
                        {data.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Manager Name */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Manager</p>
                    <p className={data.manager_name ? 'text-white' : 'text-white/30'}>
                      {data.manager_name || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Manager Contact */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <Mail className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Manager Contact</p>
                    <p className={data.manager_contact ? 'text-white' : 'text-white/30'}>
                      {data.manager_contact || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Details Card */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verticals */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                    <Layers className="h-5 w-5 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Verticals</p>
                    <p className={data.verticals ? 'text-white' : 'text-white/30'}>
                      {data.verticals || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* GEOs */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">GEOs</p>
                    <p className={data.geos ? 'text-white' : 'text-white/30'}>
                      {data.geos || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Payment Terms</p>
                    <p className={data.payment_terms ? 'text-white' : 'text-white/30'}>
                      {data.payment_terms || 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            {data.notes && (
              <Card className="bg-white/[0.02] border-white/[0.05]">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-white/40" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 whitespace-pre-wrap">{data.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Relations Section */}
            <RelationsSection
              recordId={partner.id}
              currentObjectName="partners"
            />

            {/* Comments Section */}
            <CommentSection recordId={partner.id} />

            {/* Files Section */}
            <FileSection recordId={partner.id} />

            {/* Metadata Card */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">Created</p>
                    <p className="text-sm text-white">{formatRelativeTime(partner.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">Last Updated</p>
                    <p className="text-sm text-white">{formatRelativeTime(partner.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-white/40" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-pink-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-white/50 mt-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-white/30 mt-1">
                            {formatRelativeTime(activity.occurredAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30 text-center py-4">No activity yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </SlideOver>

      {/* Edit Modal */}
      {partner && (
        <EditRecordModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          record={partner}
          objectName="Partner"
          fields={partnerFields}
        />
      )}
    </>
  );
}
