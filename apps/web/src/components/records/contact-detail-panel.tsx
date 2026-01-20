'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  Activity,
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

// Contact fields configuration
const contactFields = [
  { name: 'name', displayName: 'Name', type: 'TEXT', isRequired: true },
  { name: 'email', displayName: 'Email', type: 'EMAIL', isRequired: true },
  { name: 'phone', displayName: 'Phone', type: 'PHONE', isRequired: false },
  { name: 'company', displayName: 'Company', type: 'TEXT', isRequired: false },
  { name: 'position', displayName: 'Position', type: 'TEXT', isRequired: false },
  { name: 'notes', displayName: 'Notes', type: 'LONG_TEXT', isRequired: false },
];

interface ContactRecord {
  id: string;
  objectId: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
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

interface ContactDetailPanelProps {
  contactId: string | null;
  onClose: () => void;
}

export function ContactDetailPanel({ contactId, onClose }: ContactDetailPanelProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Get contact record
  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['records', contactId],
    queryFn: () => api.records.get(contactId!) as Promise<ContactRecord>,
    enabled: !!contactId,
  });

  // Get activity timeline
  const { data: activities } = useQuery({
    queryKey: ['activities', contactId],
    queryFn: () => api.activities.getTimeline(contactId!, 10) as Promise<ActivityItem[]>,
    enabled: !!contactId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.records.delete(contactId!),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete contact');
      }
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const data = contact?.data || {};

  return (
    <>
      <SlideOver isOpen={!!contactId} onClose={onClose} width="lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : error || !contact ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-white/50 mb-4">Contact not found</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500">
                  <AvatarFallback className="text-xl text-white bg-transparent">
                    {getInitials(data.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">{data.name || 'Unnamed Contact'}</h1>
                  {data.position && data.company && (
                    <p className="text-white/50">{data.position} at {data.company}</p>
                  )}
                  {!data.position && data.company && (
                    <p className="text-white/50">{data.company}</p>
                  )}
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
                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Email</p>
                    {data.email ? (
                      <a
                        href={`mailto:${data.email}`}
                        className="text-white hover:text-indigo-400 transition-colors"
                      >
                        {data.email}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Phone className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Phone</p>
                    {data.phone ? (
                      <a
                        href={`tel:${data.phone}`}
                        className="text-white hover:text-indigo-400 transition-colors"
                      >
                        {data.phone}
                      </a>
                    ) : (
                      <p className="text-white/30">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Company */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Company</p>
                    <p className={data.company ? 'text-white' : 'text-white/30'}>
                      {data.company || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Position */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Briefcase className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Position</p>
                    <p className={data.position ? 'text-white' : 'text-white/30'}>
                      {data.position || 'Not provided'}
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
              recordId={contact.id}
              currentObjectName="contacts"
            />

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
                    <p className="text-sm text-white">{formatRelativeTime(contact.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">Last Updated</p>
                    <p className="text-sm text-white">{formatRelativeTime(contact.updatedAt)}</p>
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
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500" />
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
      {contact && (
        <EditRecordModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          record={contact}
          objectName="Contact"
          fields={contactFields}
        />
      )}
    </>
  );
}
