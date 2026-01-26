export { DashboardProvider, useDashboard } from './dashboard-context';
export { WidgetWrapper } from './widget-wrapper';
export { WidgetRenderer } from './widget-renderer';
export { WidgetPickerModal } from './widget-picker-modal';
export { SortableWidgetGrid } from './sortable-widget-grid';
export {
  WIDGET_REGISTRY,
  DEFAULT_DASHBOARD_CONFIG,
  getWidgetGridClass,
  generateInstanceId,
} from './widget-registry';
export type {
  WidgetSize,
  WidgetDefinition,
  DashboardWidget,
  DashboardConfig,
} from './widget-registry';
