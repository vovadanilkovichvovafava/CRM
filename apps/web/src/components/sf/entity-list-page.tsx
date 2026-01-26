'use client';

import { useState, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Loader2,
  Trash2,
  Eye,
  ChevronDown,
  Settings,
  RefreshCw,
  MoreHorizontal,
  Bookmark,
  List,
  Mail,
  Tag,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getInitials } from '@/lib/utils';

interface MetricConfig {
  key: string;
  label: string;
  tooltip?: string;
}

interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface EntityListPageProps<T> {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient?: string;

  items: T[];
  isLoading: boolean;

  columns: ColumnConfig<T>[];

  getId: (item: T) => string;
  getName?: (item: T) => string;

  onRefresh?: () => void;
  onNew?: () => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;

  metrics?: MetricConfig[];

  emptyStateTitle?: string;
  emptyStateDescription?: string;

  detailPath?: string;

  children?: ReactNode;
}

interface MetricProps {
  label: string;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

function Metric({ label, value, isActive, onClick, tooltip }: MetricProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-md transition-all duration-200',
        isActive
          ? 'bg-[#0070d2] text-white'
          : 'text-white hover:bg-white/10'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap flex items-center gap-1', isActive ? 'text-white/80' : 'text-white/70')}>
        {label}
        {tooltip && <Info className="h-3 w-3" />}
      </span>
    </button>
  );
}

function EmptyStateIllustration({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <svg
        viewBox="0 0 200 180"
        className="w-64 h-48 mb-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="200" height="180" fill="#f7fafc" rx="8" />

        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <ellipse cx="45" cy="35" rx="20" ry="10" fill="#e8f4fd" />
          <ellipse cx="60" cy="32" rx="16" ry="8" fill="#e8f4fd" />
          <ellipse cx="35" cy="38" rx="14" ry="7" fill="#e8f4fd" />
        </g>

        <g className="animate-float" style={{ animationDelay: '1.5s' }}>
          <ellipse cx="155" cy="50" rx="22" ry="11" fill="#e8f4fd" />
          <ellipse cx="172" cy="47" rx="18" ry="9" fill="#e8f4fd" />
          <ellipse cx="143" cy="53" rx="15" ry="7.5" fill="#e8f4fd" />
        </g>

        <circle cx="175" cy="28" r="15" fill="#ffd166" className="animate-pulse-soft" />

        <rect x="75" y="90" width="50" height="70" rx="4" fill="#7ec8e3" />
        <rect x="85" y="100" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="105" y="100" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="85" y="125" width="10" height="15" rx="2" fill="#f7fafc" />
        <rect x="105" y="125" width="10" height="15" rx="2" fill="#f7fafc" />

        <line x1="100" y1="90" x2="100" y2="75" stroke="#7ec8e3" strokeWidth="2" />
        <circle cx="100" cy="70" r="5" fill="#0070d2" className="animate-pulse-soft" />

        <path d="M0 180 L30 130 L60 180 Z" fill="#a8d5e5" />
        <path d="M40 180 L80 110 L120 180 Z" fill="#7ec8e3" />
        <path d="M140 180 L170 125 L200 180 Z" fill="#a8d5e5" />

        <path d="M0 165 Q50 155 100 165 Q150 175 200 165 L200 180 L0 180 Z" fill="#c7f9cc" />

        <circle cx="30" cy="145" r="3" fill="#52b788" />
        <circle cx="170" cy="150" r="4" fill="#52b788" />
        <circle cx="50" cy="150" r="2" fill="#52b788" />
      </svg>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || 'No items found'}
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {description || 'When there are items that match your selections, you\'ll see them here.'}
      </p>
    </div>
  );
}

export function EntityListPage<T>({
  title,
  subtitle,
  icon: Icon,
  iconGradient = 'from-[#0070d2] to-[#00a1e0]',
  items,
  isLoading,
  columns,
  getId,
  getName,
  onRefresh,
  onNew,
  onView,
  onDelete,
  metrics,
  emptyStateTitle,
  emptyStateDescription,
  detailPath,
  children,
}: EntityListPageProps<T>) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string>('total');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const defaultMetrics: MetricConfig[] = [
    { key: 'total', label: `Total ${title}` },
  ];

  const metricsToShow = metrics || defaultMetrics;

  const metricsValues = useMemo(() => {
    return {
      total: items.length,
    };
  }, [items]);

  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br',
              iconGradient
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{title}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  {subtitle || `My ${title}`}
                </h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter className="h-5 w-5" />
            </button>

            {onNew && (
              <Button
                onClick={onNew}
                variant="outline"
                className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
              >
                {t('common.new', 'New')}
              </Button>
            )}

            <Button
              variant="outline"
              className="border-gray-300"
            >
              {t('common.listView', 'List View')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            {metricsToShow.map((metric) => (
              <Metric
                key={metric.key}
                label={metric.label}
                value={(metricsValues as Record<string, number>)[metric.key] || 0}
                isActive={activeFilter === metric.key}
                onClick={() => setActiveFilter(metric.key)}
                tooltip={metric.tooltip}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors">
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {items.length} {t('common.items', 'items')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('common.sendEmail', 'Send Email')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              <Tag className="h-4 w-4 mr-2" />
              {t('common.assignLabel', 'Assign Label')}
            </Button>
          </div>
        </div>

        <div className="sf-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0070d2]" />
            </div>
          ) : items.length === 0 ? (
            <EmptyStateIllustration
              title={emptyStateTitle}
              description={emptyStateDescription}
            />
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className={col.className}>
                      {col.label}
                    </th>
                  ))}
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {items.map((item) => {
                  const id = getId(item);
                  const name = getName ? getName(item) : id;

                  return (
                    <tr
                      key={id}
                      className="cursor-pointer"
                      onClick={() => onView?.(item)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render ? (
                            col.render(item)
                          ) : (
                            <span>{(item as Record<string, unknown>)[col.key] as string || '—'}</span>
                          )}
                        </td>
                      ))}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {onView && (
                            <button
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                              onClick={() => onView(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              onClick={() => {
                                if (confirm(`Delete ${name}?`)) {
                                  onDelete(item);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
