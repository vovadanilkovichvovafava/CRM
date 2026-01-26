'use client';

import { ReactNode, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDashboard } from './dashboard-context';
import { DashboardWidget, getWidgetGridClass, WIDGET_REGISTRY } from './widget-registry';
import { WidgetRenderer } from './widget-renderer';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SortableWidgetProps {
  widget: DashboardWidget;
  children: ReactNode;
  isEditMode: boolean;
}

function SortableWidget({ widget, children, isEditMode }: SortableWidgetProps) {
  const { i18n } = useTranslation();
  const { removeWidget, updateWidgetSize } = useDashboard();
  const definition = WIDGET_REGISTRY[widget.widgetId];
  const isRussian = i18n.language === 'ru';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSizeToggle = () => {
    if (!definition) return;
    const currentIndex = definition.allowedSizes.indexOf(widget.size);
    const nextIndex = (currentIndex + 1) % definition.allowedSizes.length;
    updateWidgetSize(widget.instanceId, definition.allowedSizes[nextIndex]);
  };

  const canResize = definition && definition.allowedSizes.length > 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        getWidgetGridClass(widget.size),
        'relative group transition-all duration-200',
        isEditMode && 'ring-2 ring-dashed ring-[#0070d2]/30 rounded-lg',
        isDragging && 'ring-[#0070d2] ring-opacity-100'
      )}
    >
      {isEditMode && (
        <div className="absolute -top-3 left-2 right-2 flex items-center justify-between z-10">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-1 bg-white px-2 py-1 rounded-t-md shadow-sm border border-gray-200 border-b-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              {isRussian ? definition?.nameRu : definition?.name}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white px-1 py-1 rounded-t-md shadow-sm border border-gray-200 border-b-0">
            {canResize && (
              <button
                onClick={handleSizeToggle}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={widget.size}
              >
                {widget.size.startsWith('1') ? (
                  <Maximize2 className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
            )}
            <button
              onClick={() => removeWidget(widget.instanceId)}
              className="p-1 rounded hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>
      )}
      <div className={cn('h-full', isEditMode && 'pointer-events-none opacity-80')}>
        {children}
      </div>
    </div>
  );
}

function DragOverlayWidget({ widget }: { widget: DashboardWidget | null }) {
  const { i18n } = useTranslation();
  const isRussian = i18n.language === 'ru';

  if (!widget) return null;

  const definition = WIDGET_REGISTRY[widget.widgetId];

  return (
    <div
      className={cn(
        getWidgetGridClass(widget.size),
        'ring-2 ring-[#0070d2] rounded-lg shadow-2xl bg-white'
      )}
    >
      <div className="absolute -top-3 left-2 flex items-center gap-1 bg-[#0070d2] text-white px-2 py-1 rounded-t-md shadow-sm">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs font-medium">
          {isRussian ? definition?.nameRu : definition?.name}
        </span>
      </div>
      <div className="h-full opacity-90 pointer-events-none">
        <WidgetRenderer widget={widget} />
      </div>
    </div>
  );
}

interface SortableWidgetGridProps {
  widgets: DashboardWidget[];
  columns: number;
}

export function SortableWidgetGrid({ widgets, columns }: SortableWidgetGridProps) {
  const { isEditMode, moveWidget, config } = useDashboard();
  const [activeWidget, setActiveWidget] = useState<DashboardWidget | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const widget = widgets.find((w) => w.instanceId === active.id);
    setActiveWidget(widget || null);
  }, [widgets]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.instanceId === active.id);
      const newIndex = widgets.findIndex((w) => w.instanceId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveWidget(active.id as string, newIndex);
      }
    }

    setActiveWidget(null);
  }, [widgets, moveWidget]);

  const handleDragCancel = useCallback(() => {
    setActiveWidget(null);
  }, []);

  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);
  const widgetIds = sortedWidgets.map((w) => w.instanceId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <div
          className="grid gap-4 auto-rows-[minmax(160px,auto)]"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {sortedWidgets.map((widget) => (
            <SortableWidget
              key={widget.instanceId}
              widget={widget}
              isEditMode={isEditMode}
            >
              <WidgetRenderer widget={widget} />
            </SortableWidget>
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
