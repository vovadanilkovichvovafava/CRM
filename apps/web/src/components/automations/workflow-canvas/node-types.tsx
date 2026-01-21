'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
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
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Node data types
export interface TriggerNodeData extends Record<string, unknown> {
  label: string;
  triggerType: string;
  objectName?: string;
  config?: Record<string, unknown>;
}

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  actionType: string;
  config?: Record<string, unknown>;
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  field?: string;
  operator?: string;
  value?: string;
}

export interface LoopNodeData extends Record<string, unknown> {
  label: string;
  collection?: string;
  itemVariable?: string;
}

// Type aliases for nodes
export type TriggerNode = Node<TriggerNodeData, 'trigger'>;
export type ActionNode = Node<ActionNodeData, 'action'>;
export type ConditionNode = Node<ConditionNodeData, 'condition'>;
export type LoopNode = Node<LoopNodeData, 'loop'>;

// Trigger Node - Starting point
export const TriggerNodeComponent = memo(({ data, selected }: NodeProps<TriggerNode>) => {
  const nodeData = data;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-xl border-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg transition-all',
        selected ? 'border-orange-400 shadow-orange-500/20' : 'border-orange-500/50'
      )}
    >
      <div className="flex items-center gap-2 border-b border-orange-500/30 bg-orange-500/10 px-3 py-2 rounded-t-xl">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">Trigger</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white">{nodeData.label}</p>
        {nodeData.objectName && (
          <p className="text-xs text-white/50 mt-1">on {nodeData.objectName}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-600"
      />
    </div>
  );
});
TriggerNodeComponent.displayName = 'TriggerNode';

// Action Node - Performs operations
const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  SEND_EMAIL: Mail,
  SEND_TELEGRAM: MessageCircle,
  CREATE_TASK: CheckSquare,
  CREATE_NOTIFICATION: Bell,
  UPDATE_FIELD: Edit,
  WEBHOOK: Globe,
  DELAY: Clock,
};

const ACTION_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  SEND_EMAIL: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/50', icon: 'bg-blue-500' },
  SEND_TELEGRAM: { bg: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/50', icon: 'bg-sky-500' },
  CREATE_TASK: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/50', icon: 'bg-green-500' },
  CREATE_NOTIFICATION: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/50', icon: 'bg-amber-500' },
  UPDATE_FIELD: { bg: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/50', icon: 'bg-purple-500' },
  WEBHOOK: { bg: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/50', icon: 'bg-pink-500' },
  DELAY: { bg: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/50', icon: 'bg-gray-500' },
};

export const ActionNodeComponent = memo(({ data, selected }: NodeProps<ActionNode>) => {
  const nodeData = data;
  const Icon = ACTION_ICONS[nodeData.actionType] || Play;
  const colors = ACTION_COLORS[nodeData.actionType] || ACTION_COLORS.DELAY;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-xl border-2 bg-gradient-to-br shadow-lg transition-all',
        colors.bg,
        selected ? 'border-white/50 shadow-white/10' : colors.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white/50 !border-2 !border-white/80"
      />
      <div className={cn('flex items-center gap-2 border-b border-white/10 px-3 py-2 rounded-t-xl', colors.bg)}>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', colors.icon)}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Action</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white">{nodeData.label}</p>
        {nodeData.config && Object.keys(nodeData.config).length > 0 && (
          <p className="text-xs text-white/40 mt-1">
            {Object.keys(nodeData.config).length} parameter(s)
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white/50 !border-2 !border-white/80"
      />
    </div>
  );
});
ActionNodeComponent.displayName = 'ActionNode';

// Condition Node - Branching logic
export const ConditionNodeComponent = memo(({ data, selected }: NodeProps<ConditionNode>) => {
  const nodeData = data;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-xl border-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg transition-all',
        selected ? 'border-yellow-400 shadow-yellow-500/20' : 'border-yellow-500/50'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-yellow-600"
      />
      <div className="flex items-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 px-3 py-2 rounded-t-xl">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500">
          <GitBranch className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Condition</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white">{nodeData.label}</p>
        {nodeData.field && (
          <p className="text-xs text-white/50 mt-1">
            {nodeData.field} {nodeData.operator} {nodeData.value}
          </p>
        )}
      </div>
      {/* True path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-600 !left-[30%]"
      />
      {/* False path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-red-600 !left-[70%]"
      />
      <div className="flex justify-between px-3 pb-2 text-[10px]">
        <span className="text-green-400">Yes</span>
        <span className="text-red-400">No</span>
      </div>
    </div>
  );
});
ConditionNodeComponent.displayName = 'ConditionNode';

// Loop Node - Iteration
export const LoopNodeComponent = memo(({ data, selected }: NodeProps<LoopNode>) => {
  const nodeData = data;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-xl border-2 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 shadow-lg transition-all',
        selected ? 'border-cyan-400 shadow-cyan-500/20' : 'border-cyan-500/50'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-cyan-600"
      />
      <div className="flex items-center gap-2 border-b border-cyan-500/30 bg-cyan-500/10 px-3 py-2 rounded-t-xl">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500">
          <RotateCw className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Loop</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white">{nodeData.label}</p>
        {nodeData.collection && (
          <p className="text-xs text-white/50 mt-1">
            for each in {nodeData.collection}
          </p>
        )}
      </div>
      {/* Loop body */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="body"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-cyan-600 !left-[30%]"
      />
      {/* Loop exit */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        className="!w-3 !h-3 !bg-white/50 !border-2 !border-white/80 !left-[70%]"
      />
      <div className="flex justify-between px-3 pb-2 text-[10px]">
        <span className="text-cyan-400">Each</span>
        <span className="text-white/50">Done</span>
      </div>
    </div>
  );
});
LoopNodeComponent.displayName = 'LoopNode';

// Export node types for React Flow
export const nodeTypes = {
  trigger: TriggerNodeComponent,
  action: ActionNodeComponent,
  condition: ConditionNodeComponent,
  loop: LoopNodeComponent,
};
