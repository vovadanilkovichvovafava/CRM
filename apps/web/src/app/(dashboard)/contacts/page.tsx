'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search,
  Filter,
  Loader2,
  Users,
  Trash2,
  Eye,
  ChevronDown,
  Settings,
  RefreshCw,
  MoreHorizontal,
  Bookmark,
  List,
  Mail,
  Tag,
  Info,
  Phone,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { ContactDetailPanel } from '@/components/records/contact-detail-panel';
import { api, ApiError } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

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

interface MetricProps {
  label: string;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

function Metric({ label, value, isActive, onClick, tooltip }: MetricProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-md transition-all duration-200',
        isActive
          ? 'bg-[#0070d2] text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap flex items-center gap-1', isActive ? 'text-white/80' : 'text-gray-500')}>
        {label}
        {tooltip && <Info className="h-3 w-3" />}
      </span>
    </button>
  );
}

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <svg
        viewBox="0 0 200 180"
        className="w-64 h-48 mb-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky background */}
        <rect width="200" height="180" fill="#f7fafc" rx="8" />

        {/* Clouds */}
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <ellipse cx="45" cy="35" rx="20" ry="10" fill="#e8f4fd" />
          <ellipse cx="60" cy="32" rx="16" ry="8" fill="#e8f4fd" />
          <ellipse cx="35" cy="38" rx="14" ry="7" fill="#e8f4fd" />
        </g>

        <g className="animate-float" style={{ animationDelay: '1.5s' }}>
          <ellipse cx="155" cy="50" rx="22" ry="11" fill="#e8f4fd" />
          <ellipse cx="172" cy="47" rx="18" ry="9" fill="#e8f4fd" />
          <ellipse cx="143" cy="53" rx="15" ry="7.5" fill="#e8f4fd" />
        </g>

        {/* Sun */}
        <circle cx="175" cy="28" r="15" fill="#ffd166" className="animate-pulse-soft" />

        {/* Tower/Building - representing contacts */}
        <rect x="75" y="90" width="50" height="70" rx="4" fill="#7ec8e3" />
        <rect x="85" y="100" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="105" y="100" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="85" y="125" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="105" y="125" width="10" height="15" rx="2" fill="#f7fafc" />

        {/* Signal antenna on building */}
        <line x1="100" y1="90" x2="100" y2="75" stroke="#7ec8e3" strokeWidth="2" />
        <circle cx="100" cy="70" r="5" fill="#0070d2" className="animate-pulse-soft" />

        {/* Mountains/Hills */}
        <path d="M0 180 L30 130 L60 180 Z" fill="#a8d5e5" />
        <path d="M40 180 L80 110 L120 180 Z" fill="#7ec8e3" />
        <path d="M140 180 L170 125 L200 180 Z" fill="#a8d5e5" />

        {/* Ground */}
        <path d="M0 165 Q50 155 100 165 Q150 175 200 165 L200 180 L0 180 Z" fill="#c7f9cc" />

        {/* Decorative elements */}
        <circle cx="30" cy="145" r="3" fill="#52b788" />
        <circle cx="170" cy="150" r="4" fill="#52b788" />
        <circle cx="50" cy="150" r="2" fill="#52b788" />
      </svg>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Get your contacts engaged
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        When there are contacts that match your selections, you&apos;ll see them here.
      </p>
    </div>
  );
}

export default function ContactsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactsObjectId, setContactsObjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('total');
  const [createdFilter, setCreatedFilter] = useState<string>('This Quarter');
  const [ownerFilter, setOwnerFilter] = useState<string>('Me');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'contacts'],
    queryFn: async () => {
      try {
        const result = await api.objects.getByName('contacts');
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await api.objects.seedSystem();
          return await api.objects.getByName('contacts');
        }
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      const id = (objectData as { id: string }).id;
      setContactsObjectId(id);
    }
  }, [objectData]);

  const handleAddContact = () => {
    if (!contactsObjectId) {
      if (objectError) {
        toast.error('Failed to load contacts configuration. Please refresh the page.');
      } else {
        toast.error('Loading contacts configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['records', 'contacts', contactsObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: contactsObjectId!,
        search: search || undefined,
      }),
    enabled: !!contactsObjectId,
  });

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

  const metrics = useMemo(() => {
    const total = contacts.length;
    return {
      total,
      noActivity: 0,
      idle: 0,
      noUpcoming: 0,
      overdue: 0,
      dueToday: 0,
      upcoming: 0,
    };
  }, [contacts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchRecords();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070d2] to-[#00a1e0]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('contacts.title', 'Contacts')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('contacts.myContacts', 'My Contacts')}
                </h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter className="h-5 w-5" />
            </button>

            <Button
              onClick={handleAddContact}
              variant="outline"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              {t('common.new', 'New')}
            </Button>

            <Button
              onClick={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}
              variant="outline"
              className="border-gray-300"
            >
              {t('contacts.listView', 'List View')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Metrics */}
          <div className="flex items-center gap-1 bg-[#16325c] rounded-lg">
            <Metric
              label={t('contacts.metrics.totalContacts', 'Total Contacts')}
              value={metrics.total}
              isActive={activeFilter === 'total'}
              onClick={() => setActiveFilter('total')}
            />
            <Metric
              label={t('contacts.metrics.noActivity', 'No Activity')}
              value={metrics.noActivity}
              isActive={activeFilter === 'noActivity'}
              onClick={() => setActiveFilter('noActivity')}
              tooltip="No activity in last 30 days"
            />
            <Metric
              label={t('contacts.metrics.idle', 'Idle')}
              value={metrics.idle}
              isActive={activeFilter === 'idle'}
              onClick={() => setActiveFilter('idle')}
              tooltip="No recent engagement"
            />
            <Metric
              label={t('contacts.metrics.noUpcoming', 'No Upcoming')}
              value={metrics.noUpcoming}
              isActive={activeFilter === 'noUpcoming'}
              onClick={() => setActiveFilter('noUpcoming')}
              tooltip="No scheduled activities"
            />
            <Metric
              label={t('contacts.metrics.overdue', 'Overdue')}
              value={metrics.overdue}
              isActive={activeFilter === 'overdue'}
              onClick={() => setActiveFilter('overdue')}
            />
            <Metric
              label={t('contacts.metrics.dueToday', 'Due Today')}
              value={metrics.dueToday}
              isActive={activeFilter === 'dueToday'}
              onClick={() => setActiveFilter('dueToday')}
            />
            <Metric
              label={t('contacts.metrics.upcoming', 'Upcoming')}
              value={metrics.upcoming}
              isActive={activeFilter === 'upcoming'}
              onClick={() => setActiveFilter('upcoming')}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">{t('contacts.filters.created', 'Created')}</span>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                {createdFilter}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">{t('contacts.filters.owner', 'Owner')}</span>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                {ownerFilter}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {contacts.length} {t('contacts.items', 'items')} • {t('contacts.filteredBy', 'Filtered by Created Date, Me, Total Contacts')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('contacts.sendEmail', 'Send Email')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              <Tag className="h-4 w-4 mr-2" />
              {t('contacts.assignLabel', 'Assign Label')}
            </Button>
          </div>
        </div>

        {/* Contacts Card */}
        <div className="sf-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
            </div>
          ) : contacts.length === 0 ? (
            <EmptyStateIllustration />
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th>{t('contacts.fields.name', 'Name')}</th>
                  <th>{t('contacts.fields.email', 'Email')}</th>
                  <th>{t('contacts.fields.company', 'Company')}</th>
                  <th>{t('contacts.fields.phone', 'Phone')}</th>
                  <th>{t('common.created', 'Created')}</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {contacts.map((contact, index) => (
                  <tr
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedContactId(contact.id)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0070d2] to-[#00a1e0] text-white text-sm font-medium">
                          {getInitials(contact.data?.name || 'U')}
                        </div>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-[#0070d2] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.data?.name || 'Unnamed'}
                        </Link>
                      </div>
                    </td>
                    <td>
                      {contact.data?.email ? (
                        <a
                          href={`mailto:${contact.data.email}`}
                          className="text-[#0070d2] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.data.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {contact.data?.company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{contact.data.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {contact.data?.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{contact.data.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                          onClick={() => setSelectedContactId(contact.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => {
                            if (confirm('Delete this contact?')) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
