'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Settings,
  Share2,
  ArrowLeft,
  Loader2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  homePhone?: string;
  mobile?: string;
  otherPhone?: string;
  fax?: string;
  company?: string;
  position?: string;
  department?: string;
  birthdate?: string;
  reportsTo?: string;
  leadSource?: string;
  assistant?: string;
  assistantPhone?: string;
  mailingAddress?: string;
  otherAddress?: string;
  notes?: string;
}

interface ContactRecord {
  id: string;
  objectId: string;
  data: ContactData;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

function ActivityButton({
  icon: Icon,
  onClick,
  color = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-[#0070d2] hover:bg-[#005fb2]',
    green: 'bg-[#2e844a] hover:bg-[#236b3a]',
    orange: 'bg-[#fe9339] hover:bg-[#e07c2c]',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95',
          colorClasses[color]
        )}
      >
        <Icon className="h-5 w-5" />
      </button>
      <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>
    </div>
  );
}

function DetailField({
  label,
  value,
  editable = true,
  icon,
}: {
  label: string;
  value?: string | null;
  editable?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded">
      <div className="w-1/3 flex-shrink-0">
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          {icon}
          {value ? (
            <span className="text-sm text-gray-900">{value}</span>
          ) : (
            <span className="text-sm text-gray-400 italic">—</span>
          )}
        </div>
        {editable && (
          <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all">
            <Pencil className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyActivities({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Calendar className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium mb-1">{t('activity.noActivities')}</p>
      <p className="text-sm text-gray-500">{t('activity.getStartedHint')}</p>
    </div>
  );
}

export function ContactDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contactId = params.id as string;

  const [activeTab, setActiveTab] = useState<'related' | 'details'>('details');
  const [activityTab, setActivityTab] = useState<'activity' | 'chatter'>('activity');
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['records', 'contact', contactId],
    queryFn: () => api.records.get(contactId) as Promise<ContactRecord>,
    enabled: !!contactId,
  });

  const _deleteMutation = useMutation({
    mutationFn: () => api.records.delete(contactId),
    onSuccess: () => {
      toast.success(t('contacts.deleteContact'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
      router.push('/contacts');
    },
    onError: () => {
      toast.error(t('errors.general'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{t('common.notFound')}</p>
        <Button onClick={() => router.push('/contacts')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('detail.backTo', { entity: t('contacts.title') })}
        </Button>
      </div>
    );
  }

  const data = contact.data || {};
  const displayName = data.name || t('common.unknown');
  const ownerName = contact.owner?.name || t('common.unknown');

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 animate-fade-in">
        {/* Breadcrumb and Actions */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('detail.backTo', { entity: t('contacts.title') })}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isFollowing ? t('detail.following') : t('detail.follow')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50 transition-colors"
            >
              {t('detail.newCase')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50 transition-colors"
            >
              {t('detail.newNote')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50 transition-colors"
            >
              {t('detail.submitForApproval')}
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info Header */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070d2] to-[#00a1e0] text-white text-lg font-semibold shadow-md">
            {getInitials(displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('contacts.title').slice(0, -1)}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div>
            <span className="text-gray-500">{t('detail.title')}</span>
            <span className="ml-2 text-gray-900">{data.position || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('detail.accountName')}</span>
            <span className="ml-2 text-gray-900">{data.company || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t('contacts.fields.phone')}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <span className="text-gray-500">{t('contacts.fields.email')}</span>
            <span className="ml-2 text-[#0070d2]">{data.email || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('detail.contactOwner')}</span>
            <Link href="#" className="ml-2 text-[#0070d2] hover:underline flex items-center gap-1 inline-flex">
              {ownerName}
              <Share2 className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Related/Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="sf-card mb-6 animate-slide-up">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('related')}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                    activeTab === 'related'
                      ? 'border-[#0070d2] text-[#0070d2]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  {t('detail.related')}
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                    activeTab === 'details'
                      ? 'border-[#0070d2] text-[#0070d2]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  {t('detail.details')}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 animate-fade-in">
              {activeTab === 'details' ? (
                <div className="grid grid-cols-2 gap-x-8">
                  {/* Left Column */}
                  <div>
                    <DetailField label={t('detail.contactOwner')} value={ownerName} />
                    <DetailField label={t('contacts.fields.name')} value={displayName} />
                    <DetailField label={t('detail.accountName')} value={data.company} />
                    <DetailField label={t('detail.title')} value={data.position} />
                    <DetailField label={t('detail.department')} value={data.department} />
                    <DetailField label={t('detail.birthdate')} value={data.birthdate} />
                    <DetailField label={t('detail.reportsTo')} value={data.reportsTo} />
                    <DetailField label={t('detail.leadSource')} value={data.leadSource} />
                  </div>

                  {/* Right Column */}
                  <div>
                    <DetailField
                      label={t('contacts.fields.phone')}
                      value={data.phone}
                      icon={data.phone && <Phone className="h-4 w-4 text-gray-400" />}
                    />
                    <DetailField label={t('detail.homePhone')} value={data.homePhone} />
                    <DetailField label={t('detail.mobile')} value={data.mobile} />
                    <DetailField label={t('detail.otherPhone')} value={data.otherPhone} />
                    <DetailField label={t('detail.fax')} value={data.fax} />
                    <DetailField
                      label={t('contacts.fields.email')}
                      value={data.email}
                      icon={data.email && <Mail className="h-4 w-4 text-gray-400" />}
                    />
                    <DetailField label={t('detail.assistant')} value={data.assistant} />
                    <DetailField label={t('detail.asstPhone')} value={data.assistantPhone} />
                  </div>

                  {/* Full Width - Addresses */}
                  <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-x-8">
                      <DetailField
                        label={t('detail.mailingAddress')}
                        value={data.mailingAddress}
                        icon={<MapPin className="h-4 w-4 text-gray-400" />}
                      />
                      <DetailField label={t('detail.otherAddress')} value={data.otherAddress} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Related Lists */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">{t('detail.cases')} (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {t('common.create')}
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {t('detail.noCases')}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">{t('detail.opportunities')} (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {t('common.create')}
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {t('detail.noOpportunities')}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">{t('detail.files')} (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {t('common.upload')}
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {t('detail.noFiles')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Activity */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col animate-slide-left">
          {/* Activity Tabs */}
          <div className="border-b border-gray-200 px-4">
            <div className="flex">
              <button
                onClick={() => setActivityTab('activity')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                  activityTab === 'activity'
                    ? 'border-[#0070d2] text-[#0070d2]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                {t('activity.title')}
              </button>
              <button
                onClick={() => setActivityTab('chatter')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                  activityTab === 'chatter'
                    ? 'border-[#0070d2] text-[#0070d2]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                {t('activity.chatter')}
              </button>
            </div>
          </div>

          {/* Activity Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <ActivityButton icon={FileText} color="blue" />
              <ActivityButton icon={Phone} color="green" />
              <ActivityButton icon={Calendar} color="blue" />
              <ActivityButton icon={Mail} color="orange" />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {t('activity.filters')}: {t('activity.allTime')} • {t('activity.allActivities')} • {t('activity.allTypes')}
            </span>
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Activity Controls */}
          <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-4 text-sm">
            <button className="text-[#0070d2] hover:underline">{t('activity.refresh')}</button>
            <span className="text-gray-300">•</span>
            <button className="text-[#0070d2] hover:underline">{t('activity.expandAll')}</button>
            <span className="text-gray-300">•</span>
            <button className="text-[#0070d2] hover:underline">{t('activity.viewAll')}</button>
          </div>

          {/* Activity Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <button className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors">
                <ChevronDown className="h-4 w-4" />
                {t('activity.upcomingOverdue')}
              </button>
            </div>

            <EmptyActivities t={t} />

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-full bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700">{t('activity.filterHint')}</p>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-[#0070d2] hover:bg-[#005fb2] transition-colors">
                {t('activity.showAllActivities')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
