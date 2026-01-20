'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
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

interface CrmRecord {
  id: string;
  objectId: string;
  data: Record<string, unknown>;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CrmRecord;
  objectName: string;
  fields: Field[];
  onSuccess?: () => void;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  objectName,
  fields,
  onSuccess,
}: EditRecordModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Initialize form data when record changes
  useEffect(() => {
    if (record && record.data) {
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        const value = record.data[field.name];
        initialData[field.name] = value !== undefined && value !== null ? String(value) : '';
      });
      setFormData(initialData);
    }
  }, [record, fields]);

  const updateMutation = useMutation({
    mutationFn: (data: { data: Record<string, unknown> }) =>
      api.records.update(record.id, data),
    onSuccess: () => {
      toast.success(`${objectName} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['records'] });
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const data = error.data as { message?: string | string[] };
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || 'Failed to update record';
        toast.error(message);
      } else {
        toast.error('Failed to update record');
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

    updateMutation.mutate({
      data: formData,
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
          <Select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            <option value="">Select {field.displayName.toLowerCase()}</option>
            {field.config?.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
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
      title={`Edit ${objectName}`}
      description={`Update ${objectName.toLowerCase()} information`}
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
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
