'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';

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

export function EmailTemplateModal({
  isOpen,
  onClose,
  template,
}: EmailTemplateModalProps) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
    isShared: false,
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
