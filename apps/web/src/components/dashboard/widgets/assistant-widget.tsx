'use client';

import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg
        viewBox="0 0 100 70"
        className="w-20 h-14 mb-2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="70" fill="#f0f7ff" rx="6" />
        <circle cx="80" cy="15" r="6" fill="#ffd166" className="animate-pulse-soft" />
        <g className="animate-float">
          <ellipse cx="25" cy="18" rx="8" ry="4" fill="#d6e8f7" />
          <ellipse cx="32" cy="16" rx="6" ry="3" fill="#d6e8f7" />
        </g>
        <path d="M0 70 L30 45 L60 70 Z" fill="#a8d5e5" />
        <path d="M40 70 L70 40 L100 70 Z" fill="#7ec8e3" />
        <path d="M0 65 Q25 58 50 65 Q75 72 100 65 L100 70 L0 70 Z" fill="#c7f9cc" />
      </svg>
    </div>
  );
}

export function AssistantWidget() {
  const { t } = useTranslation();

  return (
    <div className="sf-card h-full p-0 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-gray-100">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-900">
          {t('dashboard.assistant', 'Assistant')}
        </h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <EmptyStateIllustration />
        <p className="text-center text-gray-500 text-sm">
          {t('dashboard.nothingNeedsAttention', 'Nothing needs your attention right now. Check back later.')}
        </p>
      </div>
    </div>
  );
}
