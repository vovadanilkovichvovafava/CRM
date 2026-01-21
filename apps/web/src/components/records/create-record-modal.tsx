'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

interface Field {
  name: string;
  displayName: string;
  type: string;
  isRequired: boolean;
  config?: {
    options?: Array<{ value: string; label: string }>;
  };
}

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  objectName: string;
  fields: Field[];
  defaultStage?: string;
  onSuccess?: () => void;
}

export function CreateRecordModal({
  isOpen,
  onClose,
  objectId,
  objectName,
  fields,
  defaultStage,
  onSuccess,
}: CreateRecordModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: { objectId: string; data: Record<string, unknown>; stage?: string }) =>
      api.records.create(data),
    onSuccess: () => {
      toast.success(`${objectName} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setFormData({});
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const data = error.data as { message?: string | string[] };
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || 'Failed to create record';
        toast.error(message);
      } else {
        toast.error('Failed to create record');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = fields
      .filter((f) => f.isRequired && !formData[f.name])
      .map((f) => f.displayName);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    createMutation.mutate({
      objectId,
      data: formData,
      stage: defaultStage,
    });
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderField = (field: Field) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'LONG_TEXT':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            rows={3}
          />
        );

      case 'SELECT':
        return (
          <NativeSelect
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            <option value="">Select {field.displayName.toLowerCase()}</option>
            {field.config?.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        );

      case 'NUMBER':
      case 'DECIMAL':
      case 'CURRENCY':
      case 'PERCENT':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            step={field.type === 'DECIMAL' || field.type === 'CURRENCY' ? '0.01' : '1'}
          />
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder="email@example.com"
          />
        );

      case 'PHONE':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder="+1 555-1234"
          />
        );

      case 'URL':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder="https://example.com"
          />
        );

      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create ${objectName}`}
      description={`Add a new ${objectName.toLowerCase()} to your CRM`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {field.displayName}
              {field.isRequired && <span className="text-red-400 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${objectName}`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
