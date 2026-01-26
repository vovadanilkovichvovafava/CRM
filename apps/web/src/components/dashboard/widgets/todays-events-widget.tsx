'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Calendar } from 'lucide-react';

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <svg
        viewBox="0 0 120 80"
        className="w-24 h-16 mb-3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="120" height="80" fill="#f0f7ff" rx="6" />
        <circle cx="100" cy="20" r="8" fill="#ffd166" className="animate-pulse-soft" />
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <ellipse cx="30" cy="20" rx="10" ry="5" fill="#d6e8f7" />
          <ellipse cx="38" cy="18" rx="8" ry="4" fill="#d6e8f7" />
        </g>
        <path d="M0 80 L40 55 L80 80 Z" fill="#a8d5e5" />
        <path d="M40 80 L80 50 L120 80 Z" fill="#7ec8e3" />
        <rect x="55" y="50" width="3" height="15" fill="#8b6914" />
        <path d="M56 35 L64 50 L48 50 Z" fill="#52b788" />
        <path d="M56 40 L62 48 L50 48 Z" fill="#40916c" />
      </svg>
    </div>
  );
}

export function TodaysEventsWidget() {
  const { t } = useTranslation();

  const { data: events, isLoading } = useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => Promise.resolve([]),
    staleTime: 30000,
  });

  return (
    <div className="sf-card h-full p-0 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-gray-100">
        <Calendar className="h-4 w-4 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-900">
          {t('dashboard.todaysEvents', "Today's Events")}
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-2">
            {/* Events list would go here */}
          </div>
        ) : (
          <EmptyStateIllustration />
        )}
      </div>
    </div>
  );
}
