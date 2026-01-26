'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Activity } from 'lucide-react';

export function QuickActionsWidget() {
  const { t } = useTranslation();

  const actions = [
    {
      href: '/contacts',
      label: t('dashboard.addContact', 'Add Contact'),
      color: 'blue',
    },
    {
      href: '/companies',
      label: t('dashboard.addCompany', 'Add Company'),
      color: 'emerald',
    },
    {
      href: '/deals',
      label: t('dashboard.createDeal', 'Create Deal'),
      color: 'amber',
    },
    {
      href: '/tasks',
      label: t('dashboard.addTask', 'Add Task'),
      color: 'violet',
    },
  ];

  const colorClasses: Record<string, { bg: string; bgHover: string; text: string; hoverBg: string }> = {
    blue: { bg: 'bg-blue-100', bgHover: 'group-hover:bg-blue-200', text: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
    emerald: { bg: 'bg-emerald-100', bgHover: 'group-hover:bg-emerald-200', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
    amber: { bg: 'bg-amber-100', bgHover: 'group-hover:bg-amber-200', text: 'text-amber-600', hoverBg: 'hover:bg-amber-50' },
    violet: { bg: 'bg-violet-100', bgHover: 'group-hover:bg-violet-200', text: 'text-violet-600', hoverBg: 'hover:bg-violet-50' },
  };

  return (
    <div className="sf-card h-full p-0 flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-gray-100">
        <Activity className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">
          {t('dashboard.quickActions', 'Quick Actions')}
        </h3>
      </div>
      <div className="flex-1 p-3 space-y-1.5">
        {actions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 p-2 rounded-md transition-all group ${colors.hoverBg}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${colors.bg} ${colors.bgHover}`}>
                <Plus className={`h-3.5 w-3.5 ${colors.text}`} />
              </div>
              <span className={`text-sm font-medium text-gray-700 group-hover:${colors.text} transition-colors`}>
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
