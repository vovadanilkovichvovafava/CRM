'use client';

import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  id: string;
  name: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({
  id,
  name,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex-shrink-0 w-72">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-white">{name}</span>
        <Badge
          variant="secondary"
          className="ml-auto bg-white/5 text-white/60"
        >
          {count}
        </Badge>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[300px] rounded-lg border-2 border-dashed p-2 space-y-2 transition-colors
          ${isOver
            ? 'border-indigo-500/50 bg-indigo-500/5'
            : 'border-white/10 bg-white/[0.01]'
          }
        `}
      >
        {children}
        {count === 0 && (
          <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-white/30">
            <div>
              <p>No items</p>
              <p className="text-xs">Drag here to move</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
