'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Loader2, Building2, Trash2, Eye, AlertCircle, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreateRecordModal } from '@/components/records/create-record-modal';
import { SlideOver } from '@/components/ui/slide-over';
import { RelationsSection } from '@/components/records/relations-section';
import { api, ApiError } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';

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

export default function CompaniesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companiesObjectId, setCompaniesObjectId] = useState<string | null>(null);

  // Get companies object
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

  // Get companies records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['records', 'companies', companiesObjectId, search],
    queryFn: () =>
      api.records.list({
        objectId: companiesObjectId!,
        search: search || undefined,
      }),
    enabled: !!companiesObjectId,
  });

  // Delete mutation
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
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('companies.title')}</h1>
              <p className="text-sm text-white/50">
                {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAddCompany}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {objectLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : objectError ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {t('companies.addCompany')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder={t('companies.searchCompanies')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button variant="outline" size="icon" className="border-white/10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Companies Table */}
      <Card className="bg-white/[0.02] border-white/[0.05]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">{t('companies.noCompanies')}</h3>
              <p className="text-sm text-white/50 mb-4">
                {t('companies.createFirstCompany')}
              </p>
              <Button
                onClick={handleAddCompany}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('companies.addCompany')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('companies.fields.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('companies.fields.industry')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('companies.fields.website')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('companies.fields.address')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {t('common.date')}
                    </th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500">
                            <AvatarFallback className="text-xs text-white bg-transparent">
                              {getInitials(company.data?.name || 'C')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white">
                            {company.data?.name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {company.data?.industry || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {company.data?.website ? (
                          <a
                            href={company.data.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="h-3 w-3" />
                            {company.data.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {company.data?.city || company.data?.country
                          ? [company.data?.city, company.data?.country].filter(Boolean).join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">
                        {formatRelativeTime(company.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(company.id);
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
                              if (confirm('Delete this company?')) {
                                deleteMutation.mutate(company.id);
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
      {companiesObjectId && (
        <CreateRecordModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          objectId={companiesObjectId}
          objectName="Company"
          fields={companyFields}
        />
      )}

      {/* Company Detail Panel */}
      <SlideOver
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        title={t('common.details')}
      >
        {selectedCompany && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedCompany.data?.name || 'Unnamed'}
                </h2>
                {selectedCompany.data?.industry && (
                  <p className="text-white/50">{selectedCompany.data.industry}</p>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4">
              {selectedCompany.data?.website && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <Globe className="h-5 w-5 text-green-400" />
                  <a
                    href={selectedCompany.data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300"
                  >
                    {selectedCompany.data.website}
                  </a>
                </div>
              )}
              {(selectedCompany.data?.city || selectedCompany.data?.country) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <MapPin className="h-5 w-5 text-white/40" />
                  <span className="text-white/70">
                    {[selectedCompany.data?.city, selectedCompany.data?.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {selectedCompany.data?.employees && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <Building2 className="h-5 w-5 text-white/40" />
                  <span className="text-white/70">
                    {selectedCompany.data.employees.toLocaleString()} employees
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedCompany.data?.description && (
              <div className="p-4 rounded-lg bg-white/[0.02]">
                <h3 className="text-sm font-medium text-white/50 mb-2">{t('common.description')}</h3>
                <p className="text-white/70 whitespace-pre-wrap">
                  {selectedCompany.data.description}
                </p>
              </div>
            )}

            {/* Relations */}
            <RelationsSection recordId={selectedCompany.id} currentObjectName="companies" />

            {/* Metadata */}
            <div className="text-xs text-white/30 pt-4 border-t border-white/5">
              <p>Created {formatRelativeTime(selectedCompany.createdAt)}</p>
              <p>Updated {formatRelativeTime(selectedCompany.updatedAt)}</p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
