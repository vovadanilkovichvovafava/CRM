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
  label: _label,
  onClick,
  color = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
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
          'flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200',
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
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
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

function EmptyActivities() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Calendar className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium mb-1">No activities to show.</p>
      <p className="text-sm text-gray-500">
        Get started by sending an email, scheduling a task, and more.
      </p>
    </div>
  );
}

export function ContactDetailClient() {
  useTranslation(); // Initialize i18n
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

  // Delete mutation for future use
  const _deleteMutation = useMutation({
    mutationFn: () => api.records.delete(contactId),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      router.push('/contacts');
    },
    onError: () => {
      toast.error('Failed to delete contact');
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
        <p className="text-gray-500">Contact not found</p>
        <Button onClick={() => router.push('/contacts')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const data = contact.data || {};
  const displayName = data.name || 'Unnamed Contact';
  const ownerName = contact.owner?.name || 'Unknown Owner';

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Breadcrumb and Actions */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              New Case
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              New Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              Submit for Approval
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info Header */}
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070d2] to-[#00a1e0] text-white text-lg font-semibold">
            {getInitials(displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Contact</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="px-6 pb-4 flex items-center gap-8 text-sm">
          <div>
            <span className="text-gray-500">Title</span>
            <span className="ml-2 text-gray-900">{data.position || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Account Name</span>
            <span className="ml-2 text-gray-900">{data.company || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Phone (2)</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <span className="text-gray-500">Email</span>
            <span className="ml-2 text-[#0070d2]">{data.email || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Contact Owner</span>
            <Link href="#" className="ml-2 text-[#0070d2] hover:underline flex items-center gap-1">
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
          <div className="sf-card mb-6">
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
                  Related
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
                  Details
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 animate-fade-in">
              {activeTab === 'details' ? (
                <div className="grid grid-cols-2 gap-x-8">
                  {/* Left Column */}
                  <div>
                    <DetailField
                      label="Contact Owner"
                      value={ownerName}
                    />
                    <DetailField
                      label="Name"
                      value={displayName}
                    />
                    <DetailField
                      label="Account Name"
                      value={data.company}
                    />
                    <DetailField
                      label="Title"
                      value={data.position}
                    />
                    <DetailField
                      label="Department"
                      value={data.department}
                    />
                    <DetailField
                      label="Birthdate"
                      value={data.birthdate}
                    />
                    <DetailField
                      label="Reports To"
                      value={data.reportsTo}
                    />
                    <DetailField
                      label="Lead Source"
                      value={data.leadSource}
                    />
                  </div>

                  {/* Right Column */}
                  <div>
                    <DetailField
                      label="Phone"
                      value={data.phone}
                      icon={data.phone && <Phone className="h-4 w-4 text-gray-400" />}
                    />
                    <DetailField
                      label="Home Phone"
                      value={data.homePhone}
                    />
                    <DetailField
                      label="Mobile"
                      value={data.mobile}
                    />
                    <DetailField
                      label="Other Phone"
                      value={data.otherPhone}
                    />
                    <DetailField
                      label="Fax"
                      value={data.fax}
                    />
                    <DetailField
                      label="Email"
                      value={data.email}
                      icon={data.email && <Mail className="h-4 w-4 text-gray-400" />}
                    />
                    <DetailField
                      label="Assistant"
                      value={data.assistant}
                    />
                    <DetailField
                      label="Asst. Phone"
                      value={data.assistantPhone}
                    />
                  </div>

                  {/* Full Width - Addresses */}
                  <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-x-8">
                      <DetailField
                        label="Mailing Address"
                        value={data.mailingAddress}
                        icon={<MapPin className="h-4 w-4 text-gray-400" />}
                      />
                      <DetailField
                        label="Other Address"
                        value={data.otherAddress}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Related Lists */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                      <h3 className="font-medium text-gray-900">Cases (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        New
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No cases found
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                      <h3 className="font-medium text-gray-900">Opportunities (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        New
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No opportunities found
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                      <h3 className="font-medium text-gray-900">Files (0)</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Upload
                      </Button>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No files attached
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Activity */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
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
                Activity
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
                Chatter
              </button>
            </div>
          </div>

          {/* Activity Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <ActivityButton icon={FileText} label="Log a Call" color="blue" />
              <ActivityButton icon={Phone} label="Call" color="green" />
              <ActivityButton icon={Calendar} label="Event" color="blue" />
              <ActivityButton icon={Mail} label="Email" color="orange" />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Filters: All time • All activities • All types
            </span>
            <button className="p-1 rounded hover:bg-gray-100">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Activity Controls */}
          <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-4 text-sm">
            <button className="text-[#0070d2] hover:underline">Refresh</button>
            <span className="text-gray-300">•</span>
            <button className="text-[#0070d2] hover:underline">Expand All</button>
            <span className="text-gray-300">•</span>
            <button className="text-[#0070d2] hover:underline">View All</button>
          </div>

          {/* Activity Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <button className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <ChevronDown className="h-4 w-4" />
                Upcoming & Overdue
              </button>
            </div>

            <EmptyActivities />

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-full bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700">
                  To change what&apos;s shown, try changing your filters.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-[#0070d2] hover:bg-[#005fb2]">
                Show All Activities
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
