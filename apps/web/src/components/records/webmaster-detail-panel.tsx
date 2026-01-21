'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Mail,
  Send,
  MessageSquare,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Activity,
  Globe,
  MapPin,
  TrendingUp,
  Layers,
  Phone,
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

// Webmaster fields configuration
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
  blocked: 'bg-red-500/10 text-red-400 border-red-500/30',
};

interface WebmasterDetailPanelProps {
  webmasterId: string | null;
  onClose: () => void;
}

export function WebmasterDetailPanel({ webmasterId, onClose }: WebmasterDetailPanelProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Get webmaster record
  const { data: webmaster, isLoading, error } = useQuery({
    queryKey: ['records', webmasterId],
    queryFn: () => api.records.get(webmasterId!) as Promise<WebmasterRecord>,
    enabled: !!webmasterId,
  });

  // Get activity timeline
  const { data: activities } = useQuery({
    queryKey: ['activities', webmasterId],
    queryFn: () => api.activities.getTimeline(webmasterId!, 10) as Promise<ActivityItem[]>,
    enabled: !!webmasterId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.records.delete(webmasterId!),
    onSuccess: () => {
      toast.success('Webmaster deleted');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete webmaster');
      }
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this webmaster? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const data = webmaster?.data || {};

  return (
    <>
      <SlideOver isOpen={!!webmasterId} onClose={onClose} width="lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : error || !webmaster ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-white/50 mb-4">Webmaster not found</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-violet-500 to-purple-500">
                  <AvatarFallback className="text-xl text-white bg-transparent">
                    {getInitials(data.name || 'W')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">{data.name || 'Unnamed Webmaster'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {data.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[data.status] || 'bg-white/10 text-white/60'}`}>
                        {data.status}
                      </span>
                    )}
                    {data.verticals && (
                      <span className="text-sm text-white/50">{data.verticals}</span>
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

            {/* Contact Details Card */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Telegram */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Send className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Telegram</p>
                    {data.telegram ? (
                      <a
                        href={`https://t.me/${data.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-violet-400 transition-colors"
                      >
                        {data.telegram}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Mail className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Email</p>
                    {data.email ? (
                      <a
                        href={`mailto:${data.email}`}
                        className="text-white hover:text-violet-400 transition-colors"
                      >
                        {data.email}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Skype */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Phone className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Skype</p>
                    {data.skype ? (
                      <a
                        href={`skype:${data.skype}?chat`}
                        className="text-white hover:text-violet-400 transition-colors"
                      >
                        {data.skype}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Details Card */}
            <Card className="bg-white/[0.02] border-white/[0.05]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Traffic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Traffic Sources */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <TrendingUp className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Traffic Sources</p>
                    <p className={data.traffic_sources ? 'text-white' : 'text-white/30'}>
                      {data.traffic_sources || 'Not specified'}
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
              recordId={webmaster.id}
              currentObjectName="webmasters"
            />

            {/* Comments Section */}
            <CommentSection recordId={webmaster.id} />

            {/* Files Section */}
            <FileSection recordId={webmaster.id} />

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
                    <p className="text-sm text-white">{formatRelativeTime(webmaster.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">Last Updated</p>
                    <p className="text-sm text-white">{formatRelativeTime(webmaster.updatedAt)}</p>
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
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-violet-500" />
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
      {webmaster && (
        <EditRecordModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          record={webmaster}
          objectName="Webmaster"
          fields={webmasterFields}
        />
      )}
    </>
  );
}
