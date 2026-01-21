'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Send, Plus, Trash2, Paperclip } from 'lucide-react';
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
  attachments?: Attachment[];
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  recordId?: string;
  defaultTo?: string;
  defaultData?: Record<string, string>;
}

const SAMPLE_DATA: Record<string, string> = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  company: 'Acme Inc.',
  deal_name: 'Enterprise Plan',
  deal_value: '$10,000',
};

export function SendEmailModal({
  isOpen,
  onClose,
  template,
  recordId,
  defaultTo = '',
  defaultData = {},
}: SendEmailModalProps) {
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState<string[]>(defaultTo ? [defaultTo] : ['']);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [tokenData, setTokenData] = useState<Record<string, string>>({ ...SAMPLE_DATA, ...defaultData });
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');

  // Use template subject/body or custom
  const subject = template ? template.subject : customSubject;
  const body = template ? template.body : customBody;

  // Render template with token data
  const renderTemplate = (text: string): string => {
    let rendered = text;
    for (const [key, value] of Object.entries(tokenData)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
    return rendered;
  };

  const renderedSubject = renderTemplate(subject);
  const renderedBody = renderTemplate(body);

  // Extract tokens from template
  const templateTokens = template
    ? [...new Set([...template.subject.matchAll(/{{(\w+)}}/g), ...template.body.matchAll(/{{(\w+)}}/g)].map((m) => m[1]))]
    : [];

  const sendMutation = useMutation({
    mutationFn: () => {
      const validRecipients = recipients.filter((r) => r.trim());
      const validCc = ccRecipients.filter((r) => r.trim());

      if (validRecipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      if (template) {
        return api.emailTemplates.sendFromTemplate(template.id, {
          to: validRecipients,
          data: tokenData,
          cc: validCc.length > 0 ? validCc : undefined,
          recordId,
        });
      } else {
        return api.emailTemplates.send({
          to: validRecipients,
          cc: validCc.length > 0 ? validCc : undefined,
          subject: customSubject,
          body: customBody,
          recordId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
      toast.success('Email sent successfully');
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        const data = err.data as { message?: string } | undefined;
        toast.error(data?.message || 'Failed to send email');
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Failed to send email');
      }
    },
  });

  const addRecipient = () => {
    setRecipients((prev) => [...prev, '']);
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    setRecipients((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const addCcRecipient = () => {
    setCcRecipients((prev) => [...prev, '']);
  };

  const removeCcRecipient = (index: number) => {
    setCcRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCcRecipient = (index: number, value: string) => {
    setCcRecipients((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white">
            <Send className="h-5 w-5 inline mr-2" />
            {template ? `Send: ${template.name}` : 'Send Email'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Recipients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-white">To *</label>
              <div className="flex items-center gap-2">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCc(true);
                      if (ccRecipients.length === 0) {
                        setCcRecipients(['']);
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    + CC
                  </button>
                )}
                <button
                  type="button"
                  onClick={addRecipient}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  + Add recipient
                </button>
              </div>
            </div>
            {recipients.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={email}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {recipients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(index)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* CC Recipients */}
          {showCc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white">CC</label>
                <button
                  type="button"
                  onClick={addCcRecipient}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  + Add CC
                </button>
              </div>
              {ccRecipients.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={email}
                    onChange={(e) => updateCcRecipient(index, e.target.value)}
                    placeholder="cc@example.com"
                    type="email"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCcRecipient(index)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Token Data - only for templates with tokens */}
          {template && templateTokens.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Personalization Data</label>
              <div className="grid grid-cols-2 gap-3">
                {templateTokens.map((token) => (
                  <div key={token} className="space-y-1">
                    <label className="text-xs text-white/40">{`{{${token}}}`}</label>
                    <Input
                      value={tokenData[token] || ''}
                      onChange={(e) =>
                        setTokenData((prev) => ({ ...prev, [token]: e.target.value }))
                      }
                      placeholder={SAMPLE_DATA[token] || token}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Subject/Body for non-template emails */}
          {!template && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Subject *</label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Email subject"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Body *</label>
                <Textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Email content (HTML supported)"
                  rows={8}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Preview</label>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="border-b p-3">
                <p className="text-xs text-gray-500">Subject</p>
                <p className="text-sm font-medium text-gray-900">{renderedSubject || '(No subject)'}</p>
              </div>
              <div
                className="p-4 prose prose-sm max-w-none max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: renderedBody || '<p class="text-gray-400">No content</p>',
                }}
              />
            </div>
          </div>

          {/* Attachments info */}
          {template?.attachments && template.attachments.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Paperclip className="h-4 w-4" />
              <span>
                {template.attachments.length} attachment{template.attachments.length !== 1 ? 's' : ''} will be included
              </span>
            </div>
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
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );
}
