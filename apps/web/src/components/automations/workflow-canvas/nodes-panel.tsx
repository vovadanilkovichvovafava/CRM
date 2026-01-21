'use client';

import { DragEvent } from 'react';
import {
  Zap,
  Mail,
  MessageCircle,
  CheckSquare,
  Bell,
  Edit,
  Globe,
  Clock,
  GitBranch,
  RotateCw,
  Variable,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodePanelItem {
  type: string;
  nodeType: 'trigger' | 'action' | 'condition' | 'loop';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const TRIGGER_NODES: NodePanelItem[] = [
  {
    type: 'RECORD_CREATED',
    nodeType: 'trigger',
    label: 'Record Created',
    icon: Zap,
    color: 'bg-orange-500',
    description: 'When a new record is created',
  },
  {
    type: 'RECORD_UPDATED',
    nodeType: 'trigger',
    label: 'Record Updated',
    icon: Edit,
    color: 'bg-orange-500',
    description: 'When a record is updated',
  },
  {
    type: 'STAGE_CHANGED',
    nodeType: 'trigger',
    label: 'Stage Changed',
    icon: GitBranch,
    color: 'bg-orange-500',
    description: 'When record stage changes',
  },
];

const ACTION_NODES: NodePanelItem[] = [
  {
    type: 'SEND_EMAIL',
    nodeType: 'action',
    label: 'Send Email',
    icon: Mail,
    color: 'bg-blue-500',
    description: 'Send an email using template',
  },
  {
    type: 'SEND_TELEGRAM',
    nodeType: 'action',
    label: 'Send Telegram',
    icon: MessageCircle,
    color: 'bg-sky-500',
    description: 'Send a Telegram message',
  },
  {
    type: 'CREATE_TASK',
    nodeType: 'action',
    label: 'Create Task',
    icon: CheckSquare,
    color: 'bg-green-500',
    description: 'Create a new task',
  },
  {
    type: 'CREATE_NOTIFICATION',
    nodeType: 'action',
    label: 'Notification',
    icon: Bell,
    color: 'bg-amber-500',
    description: 'Send in-app notification',
  },
  {
    type: 'UPDATE_FIELD',
    nodeType: 'action',
    label: 'Update Field',
    icon: Edit,
    color: 'bg-purple-500',
    description: 'Update a record field',
  },
  {
    type: 'WEBHOOK',
    nodeType: 'action',
    label: 'Webhook',
    icon: Globe,
    color: 'bg-pink-500',
    description: 'Call external webhook',
  },
  {
    type: 'DELAY',
    nodeType: 'action',
    label: 'Delay',
    icon: Clock,
    color: 'bg-gray-500',
    description: 'Wait before next action',
  },
];

const LOGIC_NODES: NodePanelItem[] = [
  {
    type: 'condition',
    nodeType: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: 'bg-yellow-500',
    description: 'Branch based on condition',
  },
  {
    type: 'loop',
    nodeType: 'loop',
    label: 'Loop',
    icon: RotateCw,
    color: 'bg-cyan-500',
    description: 'Iterate over collection',
  },
];

function DraggableNode({ item }: { item: NodePanelItem }) {
  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow/type', item.nodeType);
    event.dataTransfer.setData('application/reactflow/subtype', item.type);
    event.dataTransfer.setData('application/reactflow/label', item.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing',
        'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
        'transition-all duration-150'
      )}
    >
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', item.color)}>
        <item.icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{item.label}</p>
        <p className="text-[10px] text-white/40 truncate">{item.description}</p>
      </div>
    </div>
  );
}

interface NodesPanelProps {
  onAddVariable?: () => void;
}

export function NodesPanel({ onAddVariable }: NodesPanelProps) {
  return (
    <div className="w-64 h-full bg-[#0a0a0f] border-r border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Components</h3>
        <p className="text-xs text-white/40 mt-1">Drag to canvas to add</p>
      </div>

      {/* Nodes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Triggers */}
        <div>
          <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Triggers
          </h4>
          <div className="space-y-1.5">
            {TRIGGER_NODES.map((item) => (
              <DraggableNode key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Actions
          </h4>
          <div className="space-y-1.5">
            {ACTION_NODES.map((item) => (
              <DraggableNode key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Logic */}
        <div>
          <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Logic
          </h4>
          <div className="space-y-1.5">
            {LOGIC_NODES.map((item) => (
              <DraggableNode key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Variables */}
        <div>
          <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Variables
          </h4>
          <button
            onClick={onAddVariable}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg w-full',
              'bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-white/30',
              'transition-all duration-150'
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500">
              <Variable className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-white">Create Variable</p>
              <p className="text-[10px] text-white/40">Store and reuse data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="p-3 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[10px] text-white/30 text-center">
          Use <span className="text-orange-400">{'{{variable}}'}</span> in fields to reference data
        </p>
      </div>
    </div>
  );
}
