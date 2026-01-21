'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Array<{ name: string; value: string }>;
  onAdd: (name: string, value: string) => void;
  onRemove: (name: string) => void;
}

export function VariablesModal({
  isOpen,
  onClose,
  variables,
  onAdd,
  onRemove,
}: VariablesModalProps) {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim()) return;

    // Validate variable name (alphanumeric and underscores only)
    const validName = newName.replace(/[^a-zA-Z0-9_]/g, '_');
    onAdd(validName, newValue);
    setNewName('');
    setNewValue('');
  };

  const systemVariables = [
    { name: 'record.id', description: 'Unique ID of the record' },
    { name: 'record.data', description: 'All record fields as object' },
    { name: 'record.owner_id', description: 'ID of the record owner' },
    { name: 'record.created_at', description: 'Record creation timestamp' },
    { name: 'user.id', description: 'Current user ID' },
    { name: 'user.email', description: 'Current user email' },
    { name: 'user.name', description: 'Current user name' },
    { name: 'now', description: 'Current date/time ISO string' },
    { name: 'now.date', description: 'Current date (YYYY-MM-DD)' },
    { name: 'now.time', description: 'Current time (HH:mm:ss)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-zinc-900 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
              <Variable className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Variables</h2>
              <p className="text-xs text-white/40">Create and manage workflow variables</p>
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
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* System Variables */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              System Variables
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {systemVariables.map((v) => (
                <div
                  key={v.name}
                  className="p-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <code className="text-xs text-violet-400">{`{{${v.name}}}`}</code>
                  <p className="text-[10px] text-white/40 mt-0.5">{v.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Variables */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Custom Variables
            </h3>

            {variables.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">
                No custom variables yet
              </p>
            ) : (
              <div className="space-y-2">
                {variables.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <code className="text-xs text-green-400 flex-1">{`{{${v.name}}}`}</code>
                    <span className="text-xs text-white/40 truncate max-w-[150px]">{v.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(v.name)}
                      className="h-6 w-6 text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new variable */}
            <div className="mt-3 p-3 rounded-lg bg-white/5 border border-dashed border-white/20">
              <p className="text-xs text-white/60 mb-2">Add new variable</p>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="name"
                  className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                />
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="default value"
                  className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                />
                <Button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  size="icon"
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <Button onClick={onClose} className="bg-violet-600 hover:bg-violet-700">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
