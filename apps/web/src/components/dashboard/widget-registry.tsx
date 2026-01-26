'use client';

import {
  BarChart3,
  Calendar,
  CheckSquare,
  DollarSign,
  Lightbulb,
  LineChart,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Building2,
  Clock,
  Activity,
} from 'lucide-react';

export type WidgetSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '3x2';

export interface WidgetDefinition {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
  category: 'metrics' | 'charts' | 'lists' | 'actions';
}

export interface DashboardWidget {
  instanceId: string;
  widgetId: string;
  size: WidgetSize;
  position: number;
  settings?: Record<string, unknown>;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  columns: number;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'metrics-summary': {
    id: 'metrics-summary',
    name: 'Key Metrics',
    nameRu: 'Ключевые метрики',
    description: 'Overview of contacts, companies, deals, and tasks',
    descriptionRu: 'Обзор контактов, компаний, сделок и задач',
    icon: TrendingUp,
    defaultSize: '3x1',
    allowedSizes: ['2x1', '3x1'],
    category: 'metrics',
  },
  'quarterly-performance': {
    id: 'quarterly-performance',
    name: 'Quarterly Performance',
    nameRu: 'Квартальная эффективность',
    description: 'Chart showing quarterly sales performance',
    descriptionRu: 'График квартальных продаж',
    icon: BarChart3,
    defaultSize: '2x2',
    allowedSizes: ['2x2', '3x2'],
    category: 'charts',
  },
  'todays-events': {
    id: 'todays-events',
    name: "Today's Events",
    nameRu: 'События на сегодня',
    description: 'Upcoming events for today',
    descriptionRu: 'Предстоящие события на сегодня',
    icon: Calendar,
    defaultSize: '1x2',
    allowedSizes: ['1x2', '2x2'],
    category: 'lists',
  },
  'todays-tasks': {
    id: 'todays-tasks',
    name: "Today's Tasks",
    nameRu: 'Задачи на сегодня',
    description: 'Tasks due today',
    descriptionRu: 'Задачи с дедлайном сегодня',
    icon: CheckSquare,
    defaultSize: '1x2',
    allowedSizes: ['1x2', '2x2'],
    category: 'lists',
  },
  'assistant': {
    id: 'assistant',
    name: 'Assistant',
    nameRu: 'Помощник',
    description: 'AI-powered assistant suggestions',
    descriptionRu: 'Рекомендации от ИИ-помощника',
    icon: Lightbulb,
    defaultSize: '1x2',
    allowedSizes: ['1x1', '1x2'],
    category: 'actions',
  },
  'quick-actions': {
    id: 'quick-actions',
    name: 'Quick Actions',
    nameRu: 'Быстрые действия',
    description: 'Quick access to common actions',
    descriptionRu: 'Быстрый доступ к частым действиям',
    icon: Activity,
    defaultSize: '1x1',
    allowedSizes: ['1x1', '1x2'],
    category: 'actions',
  },
  'contacts-count': {
    id: 'contacts-count',
    name: 'Contacts Count',
    nameRu: 'Количество контактов',
    description: 'Total contacts metric',
    descriptionRu: 'Общее количество контактов',
    icon: Users,
    defaultSize: '1x1',
    allowedSizes: ['1x1'],
    category: 'metrics',
  },
  'companies-count': {
    id: 'companies-count',
    name: 'Companies Count',
    nameRu: 'Количество компаний',
    description: 'Total companies metric',
    descriptionRu: 'Общее количество компаний',
    icon: Building2,
    defaultSize: '1x1',
    allowedSizes: ['1x1'],
    category: 'metrics',
  },
  'deals-value': {
    id: 'deals-value',
    name: 'Deals Value',
    nameRu: 'Сумма сделок',
    description: 'Total open deals value',
    descriptionRu: 'Общая сумма открытых сделок',
    icon: DollarSign,
    defaultSize: '1x1',
    allowedSizes: ['1x1'],
    category: 'metrics',
  },
  'tasks-due': {
    id: 'tasks-due',
    name: 'Tasks Due',
    nameRu: 'Задач к выполнению',
    description: 'Tasks due today',
    descriptionRu: 'Задачи на сегодня',
    icon: Clock,
    defaultSize: '1x1',
    allowedSizes: ['1x1'],
    category: 'metrics',
  },
  'pipeline-chart': {
    id: 'pipeline-chart',
    name: 'Pipeline Chart',
    nameRu: 'Воронка продаж',
    description: 'Visual pipeline representation',
    descriptionRu: 'Визуализация воронки продаж',
    icon: PieChart,
    defaultSize: '2x2',
    allowedSizes: ['1x2', '2x2'],
    category: 'charts',
  },
  'revenue-trend': {
    id: 'revenue-trend',
    name: 'Revenue Trend',
    nameRu: 'Тренд выручки',
    description: 'Revenue over time',
    descriptionRu: 'Динамика выручки',
    icon: LineChart,
    defaultSize: '2x1',
    allowedSizes: ['2x1', '3x1', '2x2'],
    category: 'charts',
  },
  'goals-progress': {
    id: 'goals-progress',
    name: 'Goals Progress',
    nameRu: 'Прогресс целей',
    description: 'Track your goals progress',
    descriptionRu: 'Отслеживание прогресса целей',
    icon: Target,
    defaultSize: '1x1',
    allowedSizes: ['1x1', '2x1'],
    category: 'metrics',
  },
};

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  columns: 3,
  widgets: [
    { instanceId: 'w1', widgetId: 'metrics-summary', size: '3x1', position: 0 },
    { instanceId: 'w2', widgetId: 'quarterly-performance', size: '2x2', position: 1 },
    { instanceId: 'w3', widgetId: 'assistant', size: '1x2', position: 2 },
    { instanceId: 'w4', widgetId: 'todays-events', size: '1x2', position: 3 },
    { instanceId: 'w5', widgetId: 'todays-tasks', size: '1x2', position: 4 },
    { instanceId: 'w6', widgetId: 'quick-actions', size: '1x1', position: 5 },
  ],
};

export function getWidgetGridClass(size: WidgetSize): string {
  const sizeClasses: Record<WidgetSize, string> = {
    '1x1': 'col-span-1 row-span-1',
    '2x1': 'col-span-2 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x2': 'col-span-2 row-span-2',
    '3x1': 'col-span-3 row-span-1',
    '3x2': 'col-span-3 row-span-2',
  };
  return sizeClasses[size] || 'col-span-1 row-span-1';
}

export function generateInstanceId(): string {
  return `w${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
