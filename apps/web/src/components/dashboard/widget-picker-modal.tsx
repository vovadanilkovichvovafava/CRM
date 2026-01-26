'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDashboard } from './dashboard-context';
import { WIDGET_REGISTRY, WidgetDefinition } from './widget-registry';

interface WidgetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryKey = 'metrics' | 'charts' | 'lists' | 'actions';

export function WidgetPickerModal({ isOpen, onClose }: WidgetPickerModalProps) {
  const { t, i18n } = useTranslation();
  const { config, addWidget } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');

  const isRussian = i18n.language === 'ru';

  const categories: { key: CategoryKey | 'all'; label: string; labelRu: string }[] = [
    { key: 'all', label: 'All Widgets', labelRu: 'Все виджеты' },
    { key: 'metrics', label: 'Metrics', labelRu: 'Метрики' },
    { key: 'charts', label: 'Charts', labelRu: 'Графики' },
    { key: 'lists', label: 'Lists', labelRu: 'Списки' },
    { key: 'actions', label: 'Actions', labelRu: 'Действия' },
  ];

  const widgets = Object.values(WIDGET_REGISTRY).filter(
    (w) => selectedCategory === 'all' || w.category === selectedCategory
  );

  const existingWidgetIds = config.widgets.map((w) => w.widgetId);

  const handleAddWidget = (widgetId: string) => {
    addWidget(widgetId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isRussian ? 'Добавить виджет' : 'Add Widget'}
            </h2>
            <p className="text-sm text-gray-500">
              {isRussian
                ? 'Выберите виджеты для добавления на панель'
                : 'Select widgets to add to your dashboard'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                selectedCategory === cat.key
                  ? 'bg-[#0070d2] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {isRussian ? cat.labelRu : cat.label}
            </button>
          ))}
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {widgets.map((widget) => {
              const isAdded = existingWidgetIds.includes(widget.id);
              const Icon = widget.icon;

              return (
                <div
                  key={widget.id}
                  className={cn(
                    'relative p-4 rounded-lg border-2 transition-all',
                    isAdded
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-[#0070d2] hover:bg-blue-50 cursor-pointer'
                  )}
                  onClick={() => !isAdded && handleAddWidget(widget.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isAdded ? 'bg-green-100' : 'bg-gray-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isAdded ? 'text-green-600' : 'text-gray-600'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {isRussian ? widget.nameRu : widget.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isRussian ? widget.descriptionRu : widget.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {widget.defaultSize}
                        </span>
                      </div>
                    </div>
                    {isAdded ? (
                      <div className="absolute top-2 right-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0070d2]">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
