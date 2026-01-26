'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  DashboardConfig,
  DashboardWidget,
  DEFAULT_DASHBOARD_CONFIG,
  generateInstanceId,
  WIDGET_REGISTRY,
  WidgetSize,
} from './widget-registry';

interface DashboardContextValue {
  config: DashboardConfig;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  addWidget: (widgetId: string, size?: WidgetSize) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetSize: (instanceId: string, size: WidgetSize) => void;
  moveWidget: (instanceId: string, newPosition: number) => void;
  resetToDefault: () => void;
  saveConfig: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

const STORAGE_KEY = 'crm-dashboard-config';

function loadConfig(): DashboardConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_DASHBOARD_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate loaded config
      if (parsed.widgets && Array.isArray(parsed.widgets)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load dashboard config:', e);
  }

  return DEFAULT_DASHBOARD_CONFIG;
}

function saveConfigToStorage(config: DashboardConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save dashboard config:', e);
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [isEditMode, setEditMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load config on mount
  useEffect(() => {
    const loaded = loadConfig();
    setConfig(loaded);
    setIsInitialized(true);
  }, []);

  const addWidget = useCallback((widgetId: string, size?: WidgetSize) => {
    const definition = WIDGET_REGISTRY[widgetId];
    if (!definition) return;

    const newWidget: DashboardWidget = {
      instanceId: generateInstanceId(),
      widgetId,
      size: size || definition.defaultSize,
      position: config.widgets.length,
    };

    setConfig((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  }, [config.widgets.length]);

  const removeWidget = useCallback((instanceId: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets
        .filter((w) => w.instanceId !== instanceId)
        .map((w, i) => ({ ...w, position: i })),
    }));
  }, []);

  const updateWidgetSize = useCallback((instanceId: string, size: WidgetSize) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, size } : w
      ),
    }));
  }, []);

  const moveWidget = useCallback((instanceId: string, newPosition: number) => {
    setConfig((prev) => {
      const widgets = [...prev.widgets];
      const currentIndex = widgets.findIndex((w) => w.instanceId === instanceId);
      if (currentIndex === -1) return prev;

      const [removed] = widgets.splice(currentIndex, 1);
      widgets.splice(newPosition, 0, removed);

      return {
        ...prev,
        widgets: widgets.map((w, i) => ({ ...w, position: i })),
      };
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setConfig(DEFAULT_DASHBOARD_CONFIG);
    saveConfigToStorage(DEFAULT_DASHBOARD_CONFIG);
  }, []);

  const saveConfig = useCallback(() => {
    saveConfigToStorage(config);
    setEditMode(false);
  }, [config]);

  // Auto-save when edit mode is turned off
  useEffect(() => {
    if (isInitialized && !isEditMode) {
      saveConfigToStorage(config);
    }
  }, [config, isEditMode, isInitialized]);

  return (
    <DashboardContext.Provider
      value={{
        config,
        isEditMode,
        setEditMode,
        addWidget,
        removeWidget,
        updateWidgetSize,
        moveWidget,
        resetToDefault,
        saveConfig,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
