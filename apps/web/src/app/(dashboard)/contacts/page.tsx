'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Loader2, Users, Trash2, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { ContactDetailPanel } from '@/components/records/contact-detail-panel';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';

// Default fields for contacts
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
  };
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactsObjectId, setContactsObjectId] = useState<string | null>(null);

  // Get contacts object
  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'contacts'],
    queryFn: async () => {
      try {
        const result = await api.objects.getByName('contacts');
        return result;
      } catch (error) {
        // If not found, seed system objects
        if (error instanceof ApiError && error.status === 404) {
          console.log('Contacts object not found, seeding system objects...');
          await api.objects.seedSystem();
          return await api.objects.getByName('contacts');
        }
        console.error('Error fetching contacts object:', error);
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      const id = (objectData as { id: string }).id;
      console.log('Contacts object loaded:', id);
      setContactsObjectId(id);
    }
  }, [objectData]);

  // Handle add contact click - show error if object not loaded
  const handleAddContact = () => {
    if (!contactsObjectId) {
      if (objectError) {
        toast.error('Failed to load contacts configuration. Please refresh the page.');
        console.error('Object error:', objectError);
      } else {
        toast.error('Loading contacts configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  // Get contacts records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', 'contacts', contactsObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: contactsObjectId!,
        search: search || undefined,
      }),
    enabled: !!contactsObjectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['records', 'contacts'] });
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  const contacts = (recordsData?.data as ContactRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!contactsObjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('contacts.title')}</h1>
              <p className="text-sm text-white/50">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAddContact}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {t('contacts.addContact')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder={t('contacts.searchContacts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button variant="outline" size="icon" className="border-white/10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Contacts Table */}
      <Card className="bg-white/[0.02] border-white/[0.05]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">{t('contacts.noContacts')}</h3>
              <p className="text-sm text-white/50 mb-4">
                {t('contacts.createFirstContact')}
              </p>
              <Button
                onClick={handleAddContact}
                className="bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('contacts.addContact')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('contacts.fields.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('contacts.fields.email')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('contacts.fields.company')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('contacts.fields.phone')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('common.date')}
                    </th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500">
                            <AvatarFallback className="text-xs text-white bg-transparent">
                              {getInitials(contact.data?.name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white">
                            {contact.data?.name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {contact.data?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {contact.data?.company || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {contact.data?.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">
                        {formatRelativeTime(contact.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContactId(contact.id);
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
                              if (confirm('Delete this contact?')) {
                                deleteMutation.mutate(contact.id);
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
      {contactsObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={contactsObjectId}
          objectName="Contact"
          fields={contactFields}
        />
      )}

      {/* Contact Detail Panel */}
      <ContactDetailPanel
        contactId={selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
