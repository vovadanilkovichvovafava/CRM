'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Eye, Upload, Paperclip, Trash2, File, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';

interface Attachment {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  isShared: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

const TEMPLATE_TOKENS = [
  { token: '{{first_name}}', description: 'Contact first name' },
  { token: '{{last_name}}', description: 'Contact last name' },
  { token: '{{email}}', description: 'Contact email' },
  { token: '{{company}}', description: 'Company name' },
  { token: '{{deal_name}}', description: 'Deal name' },
  { token: '{{deal_value}}', description: 'Deal value' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf' || mimeType.includes('text')) return FileText;
  return File;
}

export function EmailTemplateModal({
  isOpen,
  onClose,
  template,
}: EmailTemplateModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
    isShared: false,
  });

  // Get attachments for existing template
  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ['email-template-attachments', template?.id],
    queryFn: () => template?.id ? api.emailTemplates.getAttachments(template.id) : Promise.resolve([]),
    enabled: !!template?.id,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category || '',
        isShared: template.isShared,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: '',
        isShared: false,
      });
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.emailTemplates.create({
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category || undefined,
        isShared: data.isShared,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template created');
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to create template');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.emailTemplates.update(template!.id, {
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category || undefined,
        isShared: data.isShared,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template updated');
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to update template');
      }
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => api.emailTemplates.deleteAttachment(attachmentId),
    onSuccess: () => {
      refetchAttachments();
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Attachment deleted');
    },
    onError: () => {
      toast.error('Failed to delete attachment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (template) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertToken = (token: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + token,
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !template?.id) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);
    try {
      await api.emailTemplates.uploadAttachment(template.id, file);
      refetchAttachments();
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Attachment uploaded');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error('Failed to upload attachment');
      }
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white">
            {template ? 'Edit Template' : 'New Email Template'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-white/60 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showPreview ? (
            <div className="p-6">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="border-b p-4">
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium text-gray-900">{formData.subject || '(No subject)'}</p>
                </div>
                <div
                  className="p-6 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formData.body || '<p class="text-gray-400">No content</p>',
                  }}
                />
                {attachments.length > 0 && (
                  <div className="border-t p-4">
                    <p className="text-sm text-gray-500 mb-2">Attachments ({attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => {
                        const Icon = getFileIcon(att.mimeType);
                        return (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                          >
                            <Icon className="h-4 w-4" />
                            {att.originalName}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Template Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-white">
                  Email Subject *
                </label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to {{company}}!"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-white">
                  Category
                </label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Sales, Marketing, Support"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="body" className="block text-sm font-medium text-white">
                    Email Body *
                  </label>
                  <span className="text-xs text-white/40">HTML supported</span>
                </div>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="<p>Hello {{first_name}},</p>&#10;&#10;<p>Thank you for...</p>"
                  rows={10}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
                />
              </div>

              {/* Tokens */}
              <div className="space-y-2">
                <span className="block text-sm font-medium text-white">Available Tokens</span>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_TOKENS.map((item) => (
                    <button
                      key={item.token}
                      type="button"
                      onClick={() => insertToken(item.token)}
                      className="px-2 py-1 text-xs rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      title={item.description}
                    >
                      {item.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments - only for existing templates */}
              {template && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-medium text-white">
                      <Paperclip className="h-4 w-4 inline mr-1" />
                      Attachments
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="border-white/10 text-white/60 hover:text-white"
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Upload
                    </Button>
                  </div>

                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((att) => {
                        const Icon = getFileIcon(att.mimeType);
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon className="h-5 w-5 text-white/40 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">{att.originalName}</p>
                                <p className="text-xs text-white/40">{formatFileSize(att.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-rose-400 hover:text-rose-300"
                              >
                                View
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/40 hover:text-red-400"
                                onClick={() => deleteAttachmentMutation.mutate(att.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 text-center py-4">
                      No attachments. Upload files to include them in emails sent with this template.
                    </p>
                  )}
                </div>
              )}

              {/* Note for new templates */}
              {!template && (
                <p className="text-xs text-white/40">
                  <Paperclip className="h-3 w-3 inline mr-1" />
                  Save the template first to add attachments
                </p>
              )}

              {/* Shared */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-medium text-white">Share with team</span>
                  <p className="text-xs text-white/40">
                    Allow other team members to use this template
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, isShared: !prev.isShared }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isShared ? 'bg-rose-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isShared ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}
