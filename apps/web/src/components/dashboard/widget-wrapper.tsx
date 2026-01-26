'use client';

import { useTranslation } from 'react-i18next';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from './dashboard-context';
import {
  DashboardWidget,
  getWidgetGridClass,
  WIDGET_REGISTRY,
  WidgetSize,
} from './widget-registry';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
}

export function WidgetWrapper({ widget, children }: WidgetWrapperProps) {
  const { i18n } = useTranslation();
  const { isEditMode, removeWidget, updateWidgetSize } = useDashboard();
  const definition = WIDGET_REGISTRY[widget.widgetId];

  const isRussian = i18n.language === 'ru';

  const handleSizeToggle = () => {
    if (!definition) return;
    const currentIndex = definition.allowedSizes.indexOf(widget.size);
    const nextIndex = (currentIndex + 1) % definition.allowedSizes.length;
    updateWidgetSize(widget.instanceId, definition.allowedSizes[nextIndex]);
  };

  const canResize = definition && definition.allowedSizes.length > 1;

  return (
    <div
      className={cn(
        getWidgetGridClass(widget.size),
        'relative group transition-all duration-200',
        isEditMode && 'ring-2 ring-dashed ring-[#0070d2]/30 rounded-lg'
      )}
    >
      {isEditMode && (
        <div className="absolute -top-3 left-2 right-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-t-md shadow-sm border border-gray-200 border-b-0">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
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
