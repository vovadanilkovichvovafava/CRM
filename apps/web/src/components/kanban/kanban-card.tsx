'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KanbanCardProps {
  id: string;
  title: string;
  subtitle?: string;
  value?: number;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({
  id,
  title,
  subtitle,
  value,
  onClick,
  isDragging,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        group bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10
        transition-all cursor-pointer
        ${isDragging ? 'shadow-xl scale-105 opacity-90' : ''}
      `}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{title}</h4>
            {subtitle && (
              <p className="text-sm text-white/50 truncate mt-0.5">{subtitle}</p>
            )}
            {value !== undefined && (
              <div className="flex items-center gap-1 mt-2 text-green-400">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{formatValue(value)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
