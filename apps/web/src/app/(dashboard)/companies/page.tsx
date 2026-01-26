'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Loader2,
  Building2,
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
  Globe,
  MapPin,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { api, ApiError } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

const companyFields = [
  { name: 'name', displayName: 'Company Name', type: 'TEXT', isRequired: true },
  { name: 'website', displayName: 'Website', type: 'URL', isRequired: false },
  { name: 'industry', displayName: 'Industry', type: 'TEXT', isRequired: false },
  { name: 'employees', displayName: 'Employees', type: 'NUMBER', isRequired: false },
  { name: 'country', displayName: 'Country', type: 'TEXT', isRequired: false },
  { name: 'city', displayName: 'City', type: 'TEXT', isRequired: false },
  { name: 'description', displayName: 'Description', type: 'LONG_TEXT', isRequired: false },
];

interface CompanyRecord {
  id: string;
  objectId: string;
  data: {
    name?: string;
    website?: string;
    industry?: string;
    employees?: number;
    country?: string;
    city?: string;
    description?: string;
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
          ? 'bg-[#2e844a] text-white'
          : 'text-white hover:bg-white/10'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap flex items-center gap-1', isActive ? 'text-white/80' : 'text-white/70')}>
        {label}
        {tooltip && <Info className="h-3 w-3" />}
      </span>
    </button>
  );
}

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <svg viewBox="0 0 200 180" className="w-64 h-48 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="180" fill="#f7fafc" rx="8" />
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <ellipse cx="45" cy="35" rx="20" ry="10" fill="#e8f4fd" />
          <ellipse cx="60" cy="32" rx="16" ry="8" fill="#e8f4fd" />
        </g>
        <g className="animate-float" style={{ animationDelay: '1.5s' }}>
          <ellipse cx="155" cy="50" rx="22" ry="11" fill="#e8f4fd" />
          <ellipse cx="172" cy="47" rx="18" ry="9" fill="#e8f4fd" />
        </g>
        <circle cx="175" cy="28" r="15" fill="#ffd166" className="animate-pulse-soft" />
        <rect x="60" y="80" width="80" height="80" rx="4" fill="#52b788" />
        <rect x="70" y="95" width="25" height="20" rx="2" fill="#f7fafc" />
        <rect x="105" y="95" width="25" height="20" rx="2" fill="#f7fafc" />
        <rect x="70" y="125" width="25" height="20" rx="2" fill="#f7fafc" />
        <rect x="105" y="125" width="25" height="20" rx="2" fill="#f7fafc" />
        <path d="M0 165 Q50 155 100 165 Q150 175 200 165 L200 180 L0 180 Z" fill="#c7f9cc" />
      </svg>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Build your company database</h3>
      <p className="text-gray-500 text-center max-w-md">
        When there are companies that match your selections, you&apos;ll see them here.
      </p>
    </div>
  );
}

export default function CompaniesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [companiesObjectId, setCompaniesObjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('total');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: objectData, isLoading: objectLoading, error: objectError, refetch: refetchObject } = useQuery({
    queryKey: ['objects', 'companies'],
    queryFn: async () => {
      try {
        return await api.objects.getByName('companies');
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await api.objects.seedSystem();
          return await api.objects.getByName('companies');
        }
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (objectData) {
      setCompaniesObjectId((objectData as { id: string }).id);
    }
  }, [objectData]);

  const handleAddCompany = () => {
    if (!companiesObjectId) {
      if (objectError) {
        toast.error('Failed to load companies configuration. Please refresh the page.');
      } else {
        toast.error('Loading companies configuration...');
        refetchObject();
      }
      return;
    }
    setIsCreateOpen(true);
  };

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['records', 'companies', companiesObjectId],
    queryFn: () => api.records.list({ objectId: companiesObjectId! }),
    enabled: !!companiesObjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      toast.success('Company deleted');
      queryClient.invalidateQueries({ queryKey: ['records', 'companies'] });
    },
    onError: () => {
      toast.error('Failed to delete company');
    },
  });

  const companies = (recordsData?.data as CompanyRecord[]) || [];
  const isLoading = objectLoading || (recordsLoading && !!companiesObjectId);

  const metrics = useMemo(() => ({
    total: companies.length,
    withWebsite: companies.filter(c => c.data?.website).length,
    withEmployees: companies.filter(c => c.data?.employees).length,
  }), [companies]);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#2e844a] to-[#4bca81]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('companies.title', 'Accounts')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('companies.myCompanies', 'My Accounts')}
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
              onClick={handleAddCompany}
              variant="outline"
              className="border-[#2e844a] text-[#2e844a] hover:bg-green-50"
            >
              {t('common.new', 'New')}
            </Button>

            <Button variant="outline" className="border-gray-300">
              {t('common.listView', 'List View')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            <Metric
              label={t('companies.metrics.total', 'Total Accounts')}
              value={metrics.total}
              isActive={activeFilter === 'total'}
              onClick={() => setActiveFilter('total')}
            />
            <Metric
              label={t('companies.metrics.withWebsite', 'With Website')}
              value={metrics.withWebsite}
              isActive={activeFilter === 'withWebsite'}
              onClick={() => setActiveFilter('withWebsite')}
            />
            <Metric
              label={t('companies.metrics.withEmployees', 'With Employees')}
              value={metrics.withEmployees}
              isActive={activeFilter === 'withEmployees'}
              onClick={() => setActiveFilter('withEmployees')}
            />
          </div>

          <div className="flex items-center gap-4">
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {companies.length} {t('common.items', 'items')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-[#2e844a] text-[#2e844a] hover:bg-green-50">
              <Mail className="h-4 w-4 mr-2" />
              {t('common.sendEmail', 'Send Email')}
            </Button>
            <Button variant="outline" size="sm" className="border-[#2e844a] text-[#2e844a] hover:bg-green-50">
              <Tag className="h-4 w-4 mr-2" />
              {t('common.assignLabel', 'Assign Label')}
            </Button>
          </div>
        </div>

        <div className="sf-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#2e844a]" />
            </div>
          ) : companies.length === 0 ? (
            <EmptyStateIllustration />
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th>{t('companies.fields.name', 'Account Name')}</th>
                  <th>{t('companies.fields.industry', 'Industry')}</th>
                  <th>{t('companies.fields.website', 'Website')}</th>
                  <th>{t('companies.fields.address', 'Location')}</th>
                  <th>{t('companies.fields.employees', 'Employees')}</th>
                  <th>{t('common.created', 'Created')}</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/companies/${company.id}`)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2e844a] to-[#4bca81] text-white text-sm font-medium">
                          {getInitials(company.data?.name || 'C')}
                        </div>
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-medium text-[#0070d2] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.data?.name || 'Unnamed'}
                        </Link>
                      </div>
                    </td>
                    <td>{company.data?.industry || <span className="text-gray-400">—</span>}</td>
                    <td>
                      {company.data?.website ? (
                        <a
                          href={company.data.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0070d2] hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-4 w-4 text-gray-400" />
                          {company.data.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {company.data?.city || company.data?.country ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{[company.data?.city, company.data?.country].filter(Boolean).join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {company.data?.employees ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{company.data.employees.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                          onClick={() => router.push(`/companies/${company.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => {
                            if (confirm('Delete this company?')) {
                              deleteMutation.mutate(company.id);
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
      {companiesObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={companiesObjectId}
          objectName="Company"
          fields={companyFields}
        />
      )}
    </div>
  );
}
