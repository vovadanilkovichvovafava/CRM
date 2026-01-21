'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Share2,
  Eye,
  Send,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import { EmailTemplateModal } from '@/components/email/email-template-modal';
import { SendEmailModal } from '@/components/email/send-email-modal';

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
  attachments: Attachment[];
}

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null);

  // Get templates
  const { data, isLoading } = useQuery({
    queryKey: ['email-templates', search, selectedCategory],
    queryFn: () =>
      api.emailTemplates.list({
        search: search || undefined,
        category: selectedCategory || undefined,
      }),
  });

  // Get categories
  const { data: categories = [] } = useQuery({
    queryKey: ['email-templates', 'categories'],
    queryFn: () => api.emailTemplates.getCategories(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.emailTemplates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete template');
      }
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.emailTemplates.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template duplicated');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to duplicate template');
      }
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSend = (template: EmailTemplate) => {
    setSendingTemplate(template);
  };

  const templates = data?.data || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-500">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Email Templates</h1>
            <p className="text-sm text-white/40">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button onClick={handleCreate} className="bg-rose-600 hover:bg-rose-700">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                selectedCategory === null
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'border-white/10 text-white/60 hover:text-white'
              )}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  selectedCategory === cat
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'border-white/10 text-white/60 hover:text-white'
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Mail className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/40 mb-4">
              {search ? 'No templates found' : 'No email templates yet'}
            </p>
            <Button onClick={handleCreate} className="bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" />
              Create your first template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base text-white truncate">
                        {template.name}
                      </CardTitle>
                      <p className="text-xs text-white/40 mt-1 truncate">
                        Subject: {template.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.attachments?.length > 0 && (
                        <div className="p-1" title={`${template.attachments.length} attachment(s)`}>
                          <Paperclip className="h-3 w-3 text-white/40" />
                        </div>
                      )}
                      {template.isShared && (
                        <div className="p-1" title="Shared template">
                          <Share2 className="h-3 w-3 text-rose-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-xs text-white/50 line-clamp-3 mb-4"
                    dangerouslySetInnerHTML={{
                      __html: template.body.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...',
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {template.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {template.category}
                        </span>
                      )}
                      <span className="text-xs text-white/30">
                        {formatRelativeTime(template.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-green-400"
                        onClick={() => handleSend(template)}
                        title="Send Email"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white"
                        onClick={() => setPreviewTemplate(template)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white"
                        onClick={() => handleEdit(template)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white"
                        onClick={() => duplicateMutation.mutate(template.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-red-400"
                        onClick={() => handleDelete(template.id, template.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <EmailTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={!!sendingTemplate}
        onClose={() => setSendingTemplate(null)}
        template={sendingTemplate}
      />

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b p-4">
              <h3 className="font-semibold text-gray-900">{previewTemplate.name}</h3>
              <p className="text-sm text-gray-500">Subject: {previewTemplate.subject}</p>
            </div>
            <div
              className="p-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
            />
            {previewTemplate.attachments?.length > 0 && (
              <div className="border-t p-4">
                <p className="text-sm text-gray-500 mb-2">
                  <Paperclip className="h-4 w-4 inline mr-1" />
                  {previewTemplate.attachments.length} attachment(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {att.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t p-4 flex justify-between">
              <Button
                onClick={() => {
                  setPreviewTemplate(null);
                  setSendingTemplate(previewTemplate);
                }}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
