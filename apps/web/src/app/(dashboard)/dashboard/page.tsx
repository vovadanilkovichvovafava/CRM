'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Plus,
  RotateCcw,
  Check,
  X,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DashboardProvider,
  useDashboard,
  WidgetPickerModal,
  SortableWidgetGrid,
} from '@/components/dashboard';

function DashboardContent() {
  const { t, i18n } = useTranslation();
  const { config, isEditMode, setEditMode, resetToDefault, saveConfig } = useDashboard();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const isRussian = i18n.language === 'ru';

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('nav.home', 'Home')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('dashboard.title', 'Dashboard')}
                </h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWidgetPicker(true)}
                  className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isRussian ? 'Добавить' : 'Add Widget'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {isRussian ? 'Сбросить' : 'Reset'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={saveConfig}
                  className="bg-[#0070d2] hover:bg-[#005fb2]"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {t('common.save')}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-1" />
                {t('dashboard.customize', 'Customize')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
          <p className="text-sm text-blue-700">
            {isRussian
              ? 'Режим редактирования. Перетаскивайте виджеты для изменения порядка, изменяйте размер или удаляйте их. Нажмите "Сохранить" для применения.'
              : 'Edit mode active. Drag widgets to reorder, resize, or remove them. Click "Save" to apply changes.'}
          </p>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-auto p-6">
        {config.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LayoutGrid className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRussian ? 'Панель пуста' : 'Dashboard is empty'}
            </h3>
            <p className="text-gray-500 mb-4 text-center">
              {isRussian
                ? 'Добавьте виджеты, чтобы настроить вашу панель'
                : 'Add widgets to customize your dashboard'}
            </p>
            <Button
              onClick={() => {
                setEditMode(true);
                setShowWidgetPicker(true);
              }}
              className="bg-[#0070d2] hover:bg-[#005fb2]"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRussian ? 'Добавить виджеты' : 'Add Widgets'}
            </Button>
          </div>
        ) : (
          <SortableWidgetGrid
            widgets={config.widgets}
            columns={config.columns}
          />
        )}
      </div>

      {/* Widget Picker Modal */}
      <WidgetPickerModal
        isOpen={showWidgetPicker}
        onClose={() => setShowWidgetPicker(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
