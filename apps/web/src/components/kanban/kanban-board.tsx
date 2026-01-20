'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

export interface KanbanStage {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface KanbanItem {
  id: string;
  stage: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface KanbanBoardProps {
  stages: KanbanStage[];
  items: KanbanItem[];
  onItemMove: (itemId: string, targetStage: string) => void;
  onItemClick: (item: KanbanItem) => void;
  renderCard?: (item: KanbanItem) => React.ReactNode;
  titleField?: string;
  subtitleField?: string;
  valueField?: string;
}

export function KanbanBoard({
  stages,
  items,
  onItemMove,
  onItemClick,
  renderCard,
  titleField = 'name',
  subtitleField,
  valueField,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group items by stage
  const itemsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = items.filter((item) => item.stage === stage.id);
    return acc;
  }, {} as Record<string, KanbanItem[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over events for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetStage = stages.find((s) => s.id === overId);
    if (targetStage) {
      const item = items.find((i) => i.id === itemId);
      if (item && item.stage !== targetStage.id) {
        onItemMove(itemId, targetStage.id);
      }
      return;
    }

    // Check if dropped on another item
    const overItem = items.find((i) => i.id === overId);
    if (overItem && overItem.stage) {
      const item = items.find((i) => i.id === itemId);
      if (item && item.stage !== overItem.stage) {
        onItemMove(itemId, overItem.stage);
      }
    }
  };

  const getTitle = (item: KanbanItem): string => {
    const value = item.data[titleField];
    return typeof value === 'string' ? value : 'Untitled';
  };

  const getSubtitle = (item: KanbanItem): string | undefined => {
    if (!subtitleField) return undefined;
    const value = item.data[subtitleField];
    return typeof value === 'string' ? value : undefined;
  };

  const getValue = (item: KanbanItem): number | undefined => {
    if (!valueField) return undefined;
    const value = item.data[valueField];
    return typeof value === 'number' ? value : undefined;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            name={stage.name}
            color={stage.color}
            count={itemsByStage[stage.id]?.length || 0}
          >
            {itemsByStage[stage.id]?.map((item) =>
              renderCard ? (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="cursor-pointer"
                >
                  {renderCard(item)}
                </div>
              ) : (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  title={getTitle(item)}
                  subtitle={getSubtitle(item)}
                  value={getValue(item)}
                  onClick={() => onItemClick(item)}
                />
              )
            )}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <KanbanCard
            id={activeItem.id}
            title={getTitle(activeItem)}
            subtitle={getSubtitle(activeItem)}
            value={getValue(activeItem)}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
