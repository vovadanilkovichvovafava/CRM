'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  Columns,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform: 'none' | 'lowercase' | 'uppercase' | 'trim';
}

interface ObjectField {
  name: string;
  displayName: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
}

type Step = 'select' | 'upload' | 'map' | 'preview';

const STEPS: { key: Step; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'select', title: 'Select Object', icon: Database },
  { key: 'upload', title: 'Upload File', icon: Upload },
  { key: 'map', title: 'Map Fields', icon: Columns },
  { key: 'preview', title: 'Preview & Import', icon: Eye },
];

export default function ImportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectName, setSelectedObjectName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    headers: string[];
    sampleData: Record<string, string>[];
    suggestedMappings: Array<{
      sourceColumn: string;
      targetField: string;
      transform?: string;
    }>;
  } | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: false,
    updateExisting: false,
  });

  // Fetch available objects
  const { data: objects, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['import-export-objects'],
    queryFn: () => api.importExport.getObjects(),
  });

  // Fetch object fields when object is selected
  const { data: fields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['import-export-fields', selectedObjectId],
    queryFn: () => api.importExport.getObjectFields(selectedObjectId!),
    enabled: !!selectedObjectId,
  });

  // Upload and preview mutation
  const uploadMutation = useMutation({
    mutationFn: (params: { objectId: string; file: File }) =>
      api.importExport.uploadPreview(params.objectId, params.file),
    onSuccess: (data) => {
      setPreviewData(data);
      setMappings(data.suggestedMappings.map((m) => ({
        ...m,
        transform: (m.transform as ColumnMapping['transform']) || 'trim',
      })));
      setStep('map');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error((error.data as { message?: string })?.message || 'Failed to parse file');
      } else {
        toast.error('Failed to upload file');
      }
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: () =>
      api.importExport.import({
        objectId: selectedObjectId!,
        rows: previewData!.sampleData.length < previewData!.totalRows
          ? previewData!.sampleData // For now, send sample data - in real app, send all rows
          : previewData!.sampleData,
        mappings,
        options: importOptions,
      }),
    onSuccess: (result) => {
      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} records!`);
      } else {
        toast.warning(`Imported ${result.success} records, ${result.failed} failed`);
      }
      router.push(`/${selectedObjectName.toLowerCase()}`);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error((error.data as { message?: string })?.message || 'Import failed');
      } else {
        toast.error('Import failed');
      }
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a CSV or Excel file');
      }
    }
  }, []);

  const handleUpload = () => {
    if (selectedObjectId && file) {
      uploadMutation.mutate({ objectId: selectedObjectId, file });
    }
  };

  const updateMapping = (index: number, field: keyof ColumnMapping, value: string) => {
    setMappings((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    );
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const canProceed = () => {
    switch (step) {
      case 'select':
        return !!selectedObjectId;
      case 'upload':
        return !!file;
      case 'map':
        // Check that all required fields are mapped
        if (!fields || !mappings.length) return false;
        const requiredFields = fields.filter((f) => f.isRequired);
        const mappedFields = new Set(mappings.map((m) => m.targetField).filter(Boolean));
        return requiredFields.every((f) => mappedFields.has(f.name));
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step === 'select') setStep('upload');
    else if (step === 'upload') handleUpload();
    else if (step === 'map') setStep('preview');
    else if (step === 'preview') importMutation.mutate();
  };

  const goBack = () => {
    if (step === 'upload') setStep('select');
    else if (step === 'map') {
      setStep('upload');
      setPreviewData(null);
    }
    else if (step === 'preview') setStep('map');
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0070d2]">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('import.title')}</h1>
            <p className="text-sm text-gray-500">
              {t('import.description')}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          {t('common.cancel')}
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.key === step;
            const isComplete = i < currentStepIndex;

            return (
              <div key={s.key} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isActive && 'bg-blue-50 text-[#0070d2]',
                    isComplete && 'text-green-600',
                    !isActive && !isComplete && 'text-gray-400'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Object */}
          {step === 'select' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('import.selectObject')}
              </h2>

              {isLoadingObjects ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {objects?.map((obj) => (
                    <Card
                      key={obj.id}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedObjectId === obj.id
                          ? 'bg-blue-50 border-[#0070d2] ring-2 ring-[#0070d2]/30'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      )}
                      onClick={() => {
                        setSelectedObjectId(obj.id);
                        setSelectedObjectName(obj.name);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <FileText className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{obj.displayName}</p>
                            <p className="text-xs text-gray-500">
                              {obj.recordCount} {t('common.records')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 'upload' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('import.uploadFile')}
              </h2>

              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-colors bg-white',
                  file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-[#0070d2]'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-green-600" />
                    <div>
                      <p className="text-gray-900 font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('common.remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-gray-600">
                        {t('import.dragAndDrop')}
                      </p>
                      <label className="cursor-pointer">
                        <span className="text-[#0070d2] hover:underline">
                          {t('import.browseToUpload')}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">
                      {t('import.supportedFormats')}
                    </p>
                  </div>
                )}
              </div>

              {uploadMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-[#0070d2]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('import.processing')}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Map Fields */}
          {step === 'map' && previewData && fields && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('import.mappingFields')}
                </h2>
                <p className="text-sm text-gray-500">
                  {previewData.totalRows} {t('import.rowsFound')}
                </p>
              </div>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          {t('import.fileColumn')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          {t('import.mapsTo')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          {t('import.transform')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          {t('import.sample')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping, idx) => {
                        const sampleValue = previewData.sampleData[0]?.[mapping.sourceColumn] ?? '';

                        return (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 px-4">
                              <span className="text-gray-900">{mapping.sourceColumn}</span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={mapping.targetField}
                                onChange={(e) => updateMapping(idx, 'targetField', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-gray-900 text-sm focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                              >
                                <option value="">{t('import.skipColumn')}</option>
                                {fields.map((field) => (
                                  <option key={field.name} value={field.name}>
                                    {field.displayName}
                                    {field.isRequired && ' *'}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={mapping.transform}
                                onChange={(e) => updateMapping(idx, 'transform', e.target.value)}
                                className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-gray-900 text-sm focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                              >
                                <option value="none">{t('common.none')}</option>
                                <option value="trim">{t('import.transforms.trim')}</option>
                                <option value="lowercase">{t('import.transforms.lowercase')}</option>
                                <option value="uppercase">{t('import.transforms.uppercase')}</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-500 text-sm truncate block max-w-[200px]">
                                {sampleValue || '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Required fields warning */}
              {fields.some((f) => f.isRequired) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">{t('common.required')}:</p>
                    <p className="text-xs text-amber-700">
                      {fields.filter((f) => f.isRequired).map((f) => f.displayName).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview & Import */}
          {step === 'preview' && previewData && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('import.reviewAndImport')}
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{previewData.totalRows}</p>
                    <p className="text-sm text-gray-500">{t('import.totalRows')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-[#0070d2]">
                      {mappings.filter((m) => m.targetField).length}
                    </p>
                    <p className="text-sm text-gray-500">{t('import.mappedFields')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-400">
                      {mappings.filter((m) => !m.targetField).length}
                    </p>
                    <p className="text-sm text-gray-500">{t('import.skippedColumns')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Options */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-base">{t('import.options')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions((prev) => ({
                        ...prev,
                        skipDuplicates: e.target.checked,
                        updateExisting: e.target.checked ? false : prev.updateExisting,
                      }))}
                      className="rounded border-gray-300 text-[#0070d2] focus:ring-[#0070d2]"
                    />
                    <div>
                      <p className="text-gray-900 text-sm">{t('import.skipDuplicates')}</p>
                      <p className="text-xs text-gray-500">{t('import.skipDuplicatesDesc')}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.updateExisting}
                      onChange={(e) => setImportOptions((prev) => ({
                        ...prev,
                        updateExisting: e.target.checked,
                        skipDuplicates: e.target.checked ? false : prev.skipDuplicates,
                      }))}
                      className="rounded border-gray-300 text-[#0070d2] focus:ring-[#0070d2]"
                    />
                    <div>
                      <p className="text-gray-900 text-sm">{t('import.updateExisting')}</p>
                      <p className="text-xs text-gray-500">{t('import.updateExistingDesc')}</p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* Sample Preview */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-base">{t('import.dataPreview')}</CardTitle>
                  <CardDescription>
                    {t('import.showingRows', { count: Math.min(5, previewData.sampleData.length) })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {mappings.filter((m) => m.targetField).map((m) => (
                          <th key={m.sourceColumn} className="text-left py-2 px-3 text-gray-600 font-medium">
                            {fields?.find((f) => f.name === m.targetField)?.displayName || m.targetField}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sampleData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          {mappings.filter((m) => m.targetField).map((m) => (
                            <td key={m.sourceColumn} className="py-2 px-3 text-gray-700">
                              {row[m.sourceColumn] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 'select'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>

          <Button
            onClick={goNext}
            disabled={!canProceed() || uploadMutation.isPending || importMutation.isPending}
          >
            {(uploadMutation.isPending || importMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {step === 'preview' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('import.importRecords', { count: previewData?.totalRows || 0 })}
              </>
            ) : (
              <>
                {t('common.next')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
