'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  X,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  Edit,
  Clock,
  Workflow,
  GripVertical,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';

interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  objectId: string;
  trigger: string;
  conditions: unknown[];
  actions: unknown[];
  isActive: boolean;
}

interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface WorkflowAction {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  order: number;
}

interface WorkflowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowType | null;
}

const TRIGGER_OPTIONS = [
  { value: 'RECORD_CREATED', label: 'Record Created', icon: Zap, description: 'When a new record is created' },
  { value: 'RECORD_UPDATED', label: 'Record Updated', icon: Edit, description: 'When a record is updated' },
  { value: 'RECORD_DELETED', label: 'Record Deleted', icon: Trash2, description: 'When a record is deleted' },
  { value: 'FIELD_CHANGED', label: 'Field Changed', icon: Edit, description: 'When a specific field changes' },
  { value: 'STAGE_CHANGED', label: 'Stage Changed', icon: Workflow, description: 'When record moves to a different stage' },
  { value: 'TIME_BASED', label: 'Scheduled', icon: Clock, description: 'Run on a schedule' },
];

const ACTION_OPTIONS = [
  { type: 'SEND_EMAIL', name: 'Send Email', description: 'Send an email using a template' },
  { type: 'SEND_TELEGRAM', name: 'Send Telegram', description: 'Send a message to Telegram' },
  { type: 'CREATE_TASK', name: 'Create Task', description: 'Create a new task' },
  { type: 'CREATE_NOTIFICATION', name: 'Create Notification', description: 'Send an in-app notification' },
  { type: 'UPDATE_FIELD', name: 'Update Field', description: 'Update a field on the record' },
  { type: 'WEBHOOK', name: 'Call Webhook', description: 'Send data to an external URL' },
  { type: 'DELAY', name: 'Delay', description: 'Wait before executing next action' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function WorkflowEditorModal({
  isOpen,
  onClose,
  workflow,
}: WorkflowEditorModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectId: '',
    trigger: 'RECORD_CREATED',
    isActive: false,
  });
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  // Get objects for selection
  const { data: objectsData } = useQuery({
    queryKey: ['objects'],
    queryFn: () => api.objects.list(),
    enabled: isOpen,
  });

  // Get email templates for email action config
  const { data: templatesData } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.emailTemplates.list(),
    enabled: isOpen,
  });

  const objects = (objectsData?.data || []) as Array<{
    id: string;
    name: string;
    displayName: string;
  }>;

  const emailTemplates = (templatesData?.data || []) as Array<{
    id: string;
    name: string;
  }>;

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || '',
        objectId: workflow.objectId,
        trigger: workflow.trigger,
        isActive: workflow.isActive,
      });
      setConditions((workflow.conditions || []) as WorkflowCondition[]);
      setActions((workflow.actions || []) as WorkflowAction[]);
    } else {
      setFormData({
        name: '',
        description: '',
        objectId: objects[0]?.id || '',
        trigger: 'RECORD_CREATED',
        isActive: false,
      });
      setConditions([]);
      setActions([]);
    }
    setStep(1);
    setExpandedAction(null);
  }, [workflow, isOpen, objects]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.workflows.create({
        name: formData.name,
        description: formData.description || undefined,
        objectId: formData.objectId,
        trigger: formData.trigger,
        conditions: conditions,
        actions: actions,
        isActive: formData.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to create workflow');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.workflows.update(workflow!.id, {
        name: formData.name,
        description: formData.description || undefined,
        trigger: formData.trigger,
        conditions: conditions,
        actions: actions,
        isActive: formData.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to update workflow');
      }
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a workflow name');
      setStep(1);
      return;
    }

    if (!formData.objectId) {
      toast.error('Please select an object');
      setStep(1);
      return;
    }

    if (actions.length === 0) {
      toast.error('Please add at least one action');
      setStep(3);
      return;
    }

    if (workflow) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: '', operator: 'equals', value: '', logic: conditions.length > 0 ? 'AND' : undefined },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    setConditions(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    if (newConditions.length > 0 && newConditions[0].logic) {
      newConditions[0].logic = undefined;
    }
    setConditions(newConditions);
  };

  const addAction = (type: string) => {
    const actionDef = ACTION_OPTIONS.find((a) => a.type === type);
    if (!actionDef) return;

    const newAction: WorkflowAction = {
      id: generateId(),
      type,
      name: actionDef.name,
      config: {},
      order: actions.length,
    };

    setActions([...actions, newAction]);
    setExpandedAction(newAction.id);
  };

  const updateAction = (id: string, updates: Partial<WorkflowAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
    if (expandedAction === id) {
      setExpandedAction(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {workflow ? 'Edit Workflow' : 'New Workflow'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`flex items-center gap-1 text-xs ${
                    step === s ? 'text-orange-400' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === s
                        ? 'bg-orange-500 text-white'
                        : step > s
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {s}
                  </span>
                  <span className="hidden sm:inline">
                    {s === 1 ? 'Basic' : s === 2 ? 'Conditions' : 'Actions'}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email on New Contact"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Object *</label>
                <select
                  value={formData.objectId}
                  onChange={(e) => setFormData({ ...formData, objectId: e.target.value })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2"
                  disabled={!!workflow}
                >
                  <option value="" className="bg-zinc-900">Select an object...</option>
                  {objects.map((obj) => (
                    <option key={obj.id} value={obj.id} className="bg-zinc-900">
                      {obj.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Trigger *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_OPTIONS.map((trigger) => {
                    const Icon = trigger.icon;
                    const isSelected = formData.trigger === trigger.value;
                    return (
                      <button
                        key={trigger.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, trigger: trigger.value })}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 mt-0.5 ${
                            isSelected ? 'text-orange-400' : 'text-white/40'
                          }`}
                        />
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {trigger.label}
                          </p>
                          <p className="text-xs text-white/40">{trigger.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Conditions */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Conditions</h3>
                  <p className="text-xs text-white/40">
                    Add conditions to filter when this workflow runs (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="border-white/10 text-white/60 hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Condition
                </Button>
              </div>

              {conditions.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <p>No conditions added.</p>
                  <p className="text-xs mt-1">Workflow will run for all matching triggers.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div key={index} className="space-y-2">
                      {index > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={condition.logic || 'AND'}
                            onChange={(e) =>
                              updateCondition(index, { logic: e.target.value as 'AND' | 'OR' })
                            }
                            className="rounded bg-white/5 border border-white/10 text-white px-2 py-1 text-xs"
                          >
                            <option value="AND" className="bg-zinc-900">AND</option>
                            <option value="OR" className="bg-zinc-900">OR</option>
                          </select>
                          <div className="flex-1 h-px bg-white/10" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                        <Input
                          value={condition.field}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                          placeholder="Field (e.g., record.status)"
                          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                        />
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value })}
                          className="rounded bg-white/5 border border-white/10 text-white px-2 py-2 text-sm"
                        >
                          {OPERATOR_OPTIONS.map((op) => (
                            <option key={op.value} value={op.value} className="bg-zinc-900">
                              {op.label}
                            </option>
                          ))}
                        </select>
                        {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                          className="h-8 w-8 text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Actions */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Actions *</h3>
                  <p className="text-xs text-white/40">
                    Add actions to execute when workflow triggers
                  </p>
                </div>
              </div>

              {/* Add Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((action) => (
                  <Button
                    key={action.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAction(action.type)}
                    className="border-white/10 text-white/60 hover:text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {action.name}
                  </Button>
                ))}
              </div>

              {/* Action List */}
              {actions.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <p>No actions added.</p>
                  <p className="text-xs mt-1">Add at least one action above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action, index) => (
                    <div key={action.id} className="border border-white/10 rounded-lg overflow-hidden">
                      {/* Action Header */}
                      <div
                        className="flex items-center gap-3 p-3 bg-white/5 cursor-pointer"
                        onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                      >
                        <GripVertical className="h-4 w-4 text-white/20" />
                        <span className="flex items-center justify-center h-5 w-5 rounded bg-orange-500/20 text-orange-400 text-xs font-medium">
                          {index + 1}
                        </span>
                        <ArrowRight className="h-3 w-3 text-white/20" />
                        <span className="flex-1 text-sm text-white">{action.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAction(action.id);
                          }}
                          className="h-7 w-7 text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedAction === action.id ? (
                          <ChevronUp className="h-4 w-4 text-white/40" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/40" />
                        )}
                      </div>

                      {/* Action Config */}
                      {expandedAction === action.id && (
                        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                          <ActionConfigForm
                            action={action}
                            onUpdate={(config) => updateAction(action.id, { config })}
                            emailTemplates={emailTemplates}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-white/10 text-white/60 hover:text-white"
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {workflow ? 'Update Workflow' : 'Create Workflow'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Action Config Form Component
function ActionConfigForm({
  action,
  onUpdate,
  emailTemplates,
}: {
  action: WorkflowAction;
  onUpdate: (config: Record<string, unknown>) => void;
  emailTemplates: Array<{ id: string; name: string }>;
}) {
  const config = action.config || {};

  const updateConfig = (key: string, value: unknown) => {
    onUpdate({ ...config, [key]: value });
  };

  switch (action.type) {
    case 'SEND_EMAIL':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Email Template *</label>
            <select
              value={(config.templateId as string) || ''}
              onChange={(e) => updateConfig('templateId', e.target.value)}
              className="w-full rounded bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
            >
              <option value="" className="bg-zinc-900">Select template...</option>
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Recipient *</label>
            <Input
              value={(config.to as string) || ''}
              onChange={(e) => updateConfig('to', e.target.value)}
              placeholder="{{record.email}}"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
            <p className="text-xs text-white/30">Use variables like {'{{record.email}}'}</p>
          </div>
        </div>
      );

    case 'SEND_TELEGRAM':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Chat ID *</label>
            <Input
              value={(config.chatId as string) || ''}
              onChange={(e) => updateConfig('chatId', e.target.value)}
              placeholder="{{record.telegram_id}} or numeric ID"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Message *</label>
            <Textarea
              value={(config.message as string) || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="New record: {{record.name}}"
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
            <p className="text-xs text-white/30">Supports HTML formatting</p>
          </div>
        </div>
      );

    case 'CREATE_TASK':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Task Title *</label>
            <Input
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Follow up with {{record.name}}"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Description</label>
            <Textarea
              value={(config.description as string) || ''}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="Task description..."
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/60">Priority</label>
              <select
                value={(config.priority as string) || 'MEDIUM'}
                onChange={(e) => updateConfig('priority', e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="LOW" className="bg-zinc-900">Low</option>
                <option value="MEDIUM" className="bg-zinc-900">Medium</option>
                <option value="HIGH" className="bg-zinc-900">High</option>
                <option value="URGENT" className="bg-zinc-900">Urgent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Due in (days)</label>
              <Input
                type="number"
                value={(config.dueInDays as number) || ''}
                onChange={(e) => updateConfig('dueInDays', parseInt(e.target.value) || undefined)}
                placeholder="7"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
              />
            </div>
          </div>
        </div>
      );

    case 'CREATE_NOTIFICATION':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">User ID *</label>
            <Input
              value={(config.userId as string) || ''}
              onChange={(e) => updateConfig('userId', e.target.value)}
              placeholder="{{record.owner_id}}"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Title *</label>
            <Input
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="New record created"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Message *</label>
            <Input
              value={(config.message as string) || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="{{record.name}} has been created"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
        </div>
      );

    case 'UPDATE_FIELD':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Field Name *</label>
            <Input
              value={(config.field as string) || ''}
              onChange={(e) => updateConfig('field', e.target.value)}
              placeholder="status"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Value *</label>
            <Input
              value={(config.value as string) || ''}
              onChange={(e) => updateConfig('value', e.target.value)}
              placeholder="active"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
        </div>
      );

    case 'WEBHOOK':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">URL *</label>
            <Input
              value={(config.url as string) || ''}
              onChange={(e) => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Method</label>
            <select
              value={(config.method as string) || 'POST'}
              onChange={(e) => updateConfig('method', e.target.value)}
              className="w-full rounded bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
            >
              <option value="GET" className="bg-zinc-900">GET</option>
              <option value="POST" className="bg-zinc-900">POST</option>
              <option value="PUT" className="bg-zinc-900">PUT</option>
              <option value="PATCH" className="bg-zinc-900">PATCH</option>
            </select>
          </div>
        </div>
      );

    case 'DELAY':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Duration *</label>
            <Input
              type="number"
              value={(config.duration as number) || ''}
              onChange={(e) => updateConfig('duration', parseInt(e.target.value) || undefined)}
              placeholder="5"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Unit</label>
            <select
              value={(config.unit as string) || 'minutes'}
              onChange={(e) => updateConfig('unit', e.target.value)}
              className="w-full rounded bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
            >
              <option value="minutes" className="bg-zinc-900">Minutes</option>
              <option value="hours" className="bg-zinc-900">Hours</option>
              <option value="days" className="bg-zinc-900">Days</option>
            </select>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-xs text-white/40">
          Configuration for this action type is not yet implemented.
        </p>
      );
  }
}
