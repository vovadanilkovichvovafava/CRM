'use client';

import { DashboardWidget } from './widget-registry';
import { MetricsSummaryWidget } from './widgets/metrics-summary-widget';
import { QuarterlyPerformanceWidget } from './widgets/quarterly-performance-widget';
import { TodaysTasksWidget } from './widgets/todays-tasks-widget';
import { TodaysEventsWidget } from './widgets/todays-events-widget';
import { AssistantWidget } from './widgets/assistant-widget';
import { QuickActionsWidget } from './widgets/quick-actions-widget';
import { SingleMetricWidget } from './widgets/single-metric-widget';
import { PipelineChartWidget } from './widgets/pipeline-chart-widget';
import { RevenueTrendWidget } from './widgets/revenue-trend-widget';
import { GoalsProgressWidget } from './widgets/goals-progress-widget';

interface WidgetRendererProps {
  widget: DashboardWidget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.widgetId) {
    case 'metrics-summary':
      return <MetricsSummaryWidget />;

    case 'quarterly-performance':
      return <QuarterlyPerformanceWidget />;

    case 'todays-tasks':
      return <TodaysTasksWidget />;

    case 'todays-events':
      return <TodaysEventsWidget />;

    case 'assistant':
      return <AssistantWidget />;

    case 'quick-actions':
      return <QuickActionsWidget />;

    case 'contacts-count':
      return <SingleMetricWidget metricType="contacts-count" />;

    case 'companies-count':
      return <SingleMetricWidget metricType="companies-count" />;

    case 'deals-value':
      return <SingleMetricWidget metricType="deals-value" />;

    case 'tasks-due':
      return <SingleMetricWidget metricType="tasks-due" />;

    case 'pipeline-chart':
      return <PipelineChartWidget />;

    case 'revenue-trend':
      return <RevenueTrendWidget />;

    case 'goals-progress':
      return <GoalsProgressWidget />;

    default:
      return (
        <div className="sf-card h-full p-4 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Unknown widget: {widget.widgetId}</p>
        </div>
      );
  }
}
