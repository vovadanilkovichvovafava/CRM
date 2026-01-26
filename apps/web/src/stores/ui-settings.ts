'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavTab {
  id: string;
  label: string;
  labelKey: string;
  href: string;
  icon: string;
  order: number;
  visible: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'performance' | 'assistant' | 'events' | 'tasks' | 'chart' | 'metrics' | 'activity' | 'custom';
  title: string;
  titleKey?: string;
  gridArea: string;
  visible: boolean;
  config?: Record<string, unknown>;
}

export interface UISettings {
  navTabs: NavTab[];
  dashboardWidgets: DashboardWidget[];
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

const defaultNavTabs: NavTab[] = [
  { id: 'home', label: 'Home', labelKey: 'nav.home', href: '/dashboard', icon: 'Home', order: 0, visible: true },
  { id: 'contacts', label: 'Contacts', labelKey: 'nav.contacts', href: '/contacts', icon: 'Users', order: 1, visible: true },
  { id: 'companies', label: 'Accounts', labelKey: 'nav.companies', href: '/companies', icon: 'Building2', order: 2, visible: true },
  { id: 'deals', label: 'Deals', labelKey: 'nav.deals', href: '/deals', icon: 'DollarSign', order: 3, visible: true },
  { id: 'projects', label: 'Projects', labelKey: 'nav.projects', href: '/projects', icon: 'FolderKanban', order: 4, visible: true },
  { id: 'tasks', label: 'Tasks', labelKey: 'nav.tasks', href: '/tasks', icon: 'CheckSquare', order: 5, visible: true },
  { id: 'calendar', label: 'Calendar', labelKey: 'nav.calendar', href: '/calendar', icon: 'CalendarDays', order: 6, visible: true },
  { id: 'webmasters', label: 'Webmasters', labelKey: 'nav.webmasters', href: '/webmasters', icon: 'Globe', order: 7, visible: true },
  { id: 'partners', label: 'Partners', labelKey: 'nav.partners', href: '/partners', icon: 'Handshake', order: 8, visible: true },
  { id: 'reports', label: 'Reports', labelKey: 'nav.analytics', href: '/analytics', icon: 'BarChart3', order: 9, visible: true },
  { id: 'automations', label: 'Automations', labelKey: 'nav.automations', href: '/automations', icon: 'Workflow', order: 10, visible: false },
  { id: 'time-tracking', label: 'Time Tracking', labelKey: 'nav.timeTracking', href: '/time-tracking', icon: 'Clock', order: 11, visible: false },
  { id: 'email-templates', label: 'Email Templates', labelKey: 'nav.emailTemplates', href: '/email-templates', icon: 'Mail', order: 12, visible: false },
  { id: 'import', label: 'Import', labelKey: 'nav.importData', href: '/import', icon: 'Upload', order: 13, visible: false },
  { id: 'settings', label: 'Settings', labelKey: 'nav.settings', href: '/settings', icon: 'Settings', order: 14, visible: false },
];

const defaultDashboardWidgets: DashboardWidget[] = [
  {
    id: 'performance',
    type: 'performance',
    title: 'Quarterly Performance',
    titleKey: 'dashboard.quarterlyPerformance',
    gridArea: 'main',
    visible: true,
  },
  {
    id: 'assistant',
    type: 'assistant',
    title: 'Assistant',
    titleKey: 'dashboard.assistant',
    gridArea: 'sidebar',
    visible: true,
  },
  {
    id: 'events',
    type: 'events',
    title: "Today's Events",
    titleKey: 'dashboard.todaysEvents',
    gridArea: 'bottom-left',
    visible: true,
  },
  {
    id: 'tasks',
    type: 'tasks',
    title: "Today's Tasks",
    titleKey: 'dashboard.todaysTasks',
    gridArea: 'bottom-center',
    visible: true,
  },
  {
    id: 'activity',
    type: 'activity',
    title: 'Recent Activity',
    titleKey: 'dashboard.recentActivity',
    gridArea: 'bottom-right',
    visible: false,
  },
];

interface UISettingsState {
  settings: UISettings;
  updateNavTabs: (tabs: NavTab[]) => void;
  toggleNavTab: (tabId: string) => void;
  reorderNavTabs: (fromIndex: number, toIndex: number) => void;
  updateDashboardWidgets: (widgets: DashboardWidget[]) => void;
  toggleWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, config: Record<string, unknown>) => void;
  toggleSidebar: () => void;
  toggleCompactMode: () => void;
  resetToDefaults: () => void;
}

export const useUISettingsStore = create<UISettingsState>()(
  persist(
    (set) => ({
      settings: {
        navTabs: defaultNavTabs,
        dashboardWidgets: defaultDashboardWidgets,
        sidebarCollapsed: false,
        compactMode: false,
      },
      updateNavTabs: (tabs) =>
        set((state) => ({
          settings: { ...state.settings, navTabs: tabs },
        })),
      toggleNavTab: (tabId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            navTabs: state.settings.navTabs.map((tab) =>
              tab.id === tabId ? { ...tab, visible: !tab.visible } : tab
            ),
          },
        })),
      reorderNavTabs: (fromIndex, toIndex) =>
        set((state) => {
          const tabs = [...state.settings.navTabs];
          const [removed] = tabs.splice(fromIndex, 1);
          tabs.splice(toIndex, 0, removed);
          return {
            settings: {
              ...state.settings,
              navTabs: tabs.map((tab, index) => ({ ...tab, order: index })),
            },
          };
        }),
      updateDashboardWidgets: (widgets) =>
        set((state) => ({
          settings: { ...state.settings, dashboardWidgets: widgets },
        })),
      toggleWidget: (widgetId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            dashboardWidgets: state.settings.dashboardWidgets.map((widget) =>
              widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
            ),
          },
        })),
      updateWidgetConfig: (widgetId, config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            dashboardWidgets: state.settings.dashboardWidgets.map((widget) =>
              widget.id === widgetId ? { ...widget, config: { ...widget.config, ...config } } : widget
            ),
          },
        })),
      toggleSidebar: () =>
        set((state) => ({
          settings: { ...state.settings, sidebarCollapsed: !state.settings.sidebarCollapsed },
        })),
      toggleCompactMode: () =>
        set((state) => ({
          settings: { ...state.settings, compactMode: !state.settings.compactMode },
        })),
      resetToDefaults: () =>
        set({
          settings: {
            navTabs: defaultNavTabs,
            dashboardWidgets: defaultDashboardWidgets,
            sidebarCollapsed: false,
            compactMode: false,
          },
        }),
    }),
    {
      name: 'janus-ui-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
