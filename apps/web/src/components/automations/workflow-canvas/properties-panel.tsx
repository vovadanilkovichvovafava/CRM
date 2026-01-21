'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Trash2, Copy, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
  emailTemplates?: Array<{ id: string; name: string }>;
  variables?: Array<{ name: string; value: string }>;
}

export function PropertiesPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  emailTemplates = [],
  variables = [],
}: PropertiesPanelProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (selectedNode) {
      setLocalData(selectedNode.data as Record<string, unknown>);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const updateField = (field: string, value: unknown) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdateNode(selectedNode.id, newData);
  };

  const updateConfig = (key: string, value: unknown) => {
    const config = (localData.config as Record<string, unknown>) || {};
    const newConfig = { ...config, [key]: value };
    updateField('config', newConfig);
  };

  const config = (localData.config as Record<string, unknown>) || {};
  const nodeType = selectedNode.type;
  const actionType = localData.actionType as string;
  const triggerType = localData.triggerType as string;

  const insertVariable = (fieldId: string, varName: string) => {
    const input = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = (config[fieldId.replace('config-', '')] as string) || '';
      const newValue = currentValue.slice(0, start) + `{{${varName}}}` + currentValue.slice(end);
      updateConfig(fieldId.replace('config-', ''), newValue);
    }
  };

  return (
    <div className="w-80 h-full bg-[#0a0a0f] border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white">{localData.label as string}</h3>
          <p className="text-xs text-white/40 capitalize">{nodeType} node</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common: Label */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/60">Label</label>
          <Input
            value={(localData.label as string) || ''}
            onChange={(e) => updateField('label', e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm"
          />
        </div>

        {/* Trigger config */}
        {nodeType === 'trigger' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Trigger Type</label>
              <select
                value={triggerType || ''}
                onChange={(e) => updateField('triggerType', e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="RECORD_CREATED" className="bg-zinc-900">Record Created</option>
                <option value="RECORD_UPDATED" className="bg-zinc-900">Record Updated</option>
                <option value="RECORD_DELETED" className="bg-zinc-900">Record Deleted</option>
                <option value="FIELD_CHANGED" className="bg-zinc-900">Field Changed</option>
                <option value="STAGE_CHANGED" className="bg-zinc-900">Stage Changed</option>
              </select>
            </div>
          </>
        )}

        {/* Action configs */}
        {nodeType === 'action' && (
          <>
            {actionType === 'SEND_EMAIL' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Email Template</label>
                  <select
                    value={(config.templateId as string) || ''}
                    onChange={(e) => updateConfig('templateId', e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-zinc-900">Select template...</option>
                    {emailTemplates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Recipient</label>
                  <Input
                    id="config-to"
                    value={(config.to as string) || ''}
                    onChange={(e) => updateConfig('to', e.target.value)}
                    placeholder="{{record.email}}"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                  <VariableDropdown variables={variables} onSelect={(v) => insertVariable('config-to', v)} />
                </div>
              </>
            )}

            {actionType === 'SEND_TELEGRAM' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Chat ID</label>
                  <Input
                    id="config-chatId"
                    value={(config.chatId as string) || ''}
                    onChange={(e) => updateConfig('chatId', e.target.value)}
                    placeholder="{{record.telegram_id}}"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Message</label>
                  <Textarea
                    id="config-message"
                    value={(config.message as string) || ''}
                    onChange={(e) => updateConfig('message', e.target.value)}
                    placeholder="New: {{record.name}}"
                    rows={4}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                  <VariableDropdown variables={variables} onSelect={(v) => insertVariable('config-message', v)} />
                </div>
              </>
            )}

            {actionType === 'CREATE_TASK' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Task Title</label>
                  <Input
                    value={(config.title as string) || ''}
                    onChange={(e) => updateConfig('title', e.target.value)}
                    placeholder="Follow up with {{record.name}}"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Description</label>
                  <Textarea
                    value={(config.description as string) || ''}
                    onChange={(e) => updateConfig('description', e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/60">Priority</label>
                    <select
                      value={(config.priority as string) || 'MEDIUM'}
                      onChange={(e) => updateConfig('priority', e.target.value)}
                      className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                    >
                      <option value="LOW" className="bg-zinc-900">Low</option>
                      <option value="MEDIUM" className="bg-zinc-900">Medium</option>
                      <option value="HIGH" className="bg-zinc-900">High</option>
                      <option value="URGENT" className="bg-zinc-900">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/60">Due in (days)</label>
                    <Input
                      type="number"
                      value={(config.dueInDays as number) || ''}
                      onChange={(e) => updateConfig('dueInDays', parseInt(e.target.value) || undefined)}
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {actionType === 'UPDATE_FIELD' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Field Name</label>
                  <Input
                    value={(config.field as string) || ''}
                    onChange={(e) => updateConfig('field', e.target.value)}
                    placeholder="status"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Value</label>
                  <Input
                    value={(config.value as string) || ''}
                    onChange={(e) => updateConfig('value', e.target.value)}
                    placeholder="active"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </>
            )}

            {actionType === 'WEBHOOK' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">URL</label>
                  <Input
                    value={(config.url as string) || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Method</label>
                  <select
                    value={(config.method as string) || 'POST'}
                    onChange={(e) => updateConfig('method', e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                  >
                    <option value="GET" className="bg-zinc-900">GET</option>
                    <option value="POST" className="bg-zinc-900">POST</option>
                    <option value="PUT" className="bg-zinc-900">PUT</option>
                    <option value="PATCH" className="bg-zinc-900">PATCH</option>
                  </select>
                </div>
              </>
            )}

            {actionType === 'DELAY' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Duration</label>
                  <Input
                    type="number"
                    value={(config.duration as number) || ''}
                    onChange={(e) => updateConfig('duration', parseInt(e.target.value) || undefined)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Unit</label>
                  <select
                    value={(config.unit as string) || 'minutes'}
                    onChange={(e) => updateConfig('unit', e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                  >
                    <option value="minutes" className="bg-zinc-900">Minutes</option>
                    <option value="hours" className="bg-zinc-900">Hours</option>
                    <option value="days" className="bg-zinc-900">Days</option>
                  </select>
                </div>
              </div>
            )}

            {actionType === 'CREATE_NOTIFICATION' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">User ID</label>
                  <Input
                    value={(config.userId as string) || ''}
                    onChange={(e) => updateConfig('userId', e.target.value)}
                    placeholder="{{record.owner_id}}"
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Title</label>
                  <Input
                    value={(config.title as string) || ''}
                    onChange={(e) => updateConfig('title', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Message</label>
                  <Textarea
                    value={(config.message as string) || ''}
                    onChange={(e) => updateConfig('message', e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Condition config */}
        {nodeType === 'condition' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Field</label>
              <Input
                value={(localData.field as string) || ''}
                onChange={(e) => updateField('field', e.target.value)}
                placeholder="record.status"
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Operator</label>
              <select
                value={(localData.operator as string) || 'equals'}
                onChange={(e) => updateField('operator', e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="equals" className="bg-zinc-900">Equals</option>
                <option value="not_equals" className="bg-zinc-900">Does not equal</option>
                <option value="contains" className="bg-zinc-900">Contains</option>
                <option value="greater_than" className="bg-zinc-900">Greater than</option>
                <option value="less_than" className="bg-zinc-900">Less than</option>
                <option value="is_empty" className="bg-zinc-900">Is empty</option>
                <option value="is_not_empty" className="bg-zinc-900">Is not empty</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Value</label>
              <Input
                value={(localData.value as string) || ''}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="active"
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
          </>
        )}

        {/* Loop config */}
        {nodeType === 'loop' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Collection</label>
              <Input
                value={(localData.collection as string) || ''}
                onChange={(e) => updateField('collection', e.target.value)}
                placeholder="record.items"
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Item Variable Name</label>
              <Input
                value={(localData.itemVariable as string) || ''}
                onChange={(e) => updateField('itemVariable', e.target.value)}
                placeholder="item"
                className="bg-white/5 border-white/10 text-white text-sm"
              />
              <p className="text-[10px] text-white/30">Use as {'{{item.field}}'} in loop</p>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDuplicateNode(selectedNode.id)}
          className="flex-1 border-white/10 text-white/60 hover:text-white"
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// Helper component for variable insertion
function VariableDropdown({
  variables,
  onSelect,
}: {
  variables: Array<{ name: string; value: string }>;
  onSelect: (name: string) => void;
}) {
  const systemVars = [
    { name: 'record.id', desc: 'Record ID' },
    { name: 'record.email', desc: 'Email field' },
    { name: 'record.name', desc: 'Name field' },
    { name: 'record.owner_id', desc: 'Owner ID' },
    { name: 'user.id', desc: 'Current user ID' },
    { name: 'user.email', desc: 'Current user email' },
    { name: 'now', desc: 'Current timestamp' },
  ];

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {systemVars.slice(0, 4).map((v) => (
        <button
          key={v.name}
          type="button"
          onClick={() => onSelect(v.name)}
          className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
        >
          {v.name}
        </button>
      ))}
      {variables.map((v) => (
        <button
          key={v.name}
          type="button"
          onClick={() => onSelect(v.name)}
          className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30"
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}
