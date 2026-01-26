'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus, Search, FileQuestion, Users, Building2, Calendar, FolderOpen } from 'lucide-react';

// Pre-defined illustration types
type IllustrationType = 'contacts' | 'companies' | 'calendar' | 'search' | 'files' | 'generic';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  illustration?: IllustrationType;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function ContactsIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Clouds */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        <ellipse cx="45" cy="30" rx="18" ry="9" fill="#e2e8f0" />
        <ellipse cx="58" cy="27" rx="14" ry="7" fill="#e2e8f0" />
      </g>

      <g className="animate-float" style={{ animationDelay: '1.5s' }}>
        <ellipse cx="155" cy="40" rx="20" ry="10" fill="#e2e8f0" />
        <ellipse cx="170" cy="37" rx="16" ry="8" fill="#e2e8f0" />
      </g>

      {/* Building */}
      <rect x="70" y="70" width="60" height="70" rx="4" fill="#0070d2" opacity="0.2" />
      <rect x="80" y="80" width="12" height="16" rx="2" fill="#0070d2" opacity="0.4" />
      <rect x="108" y="80" width="12" height="16" rx="2" fill="#0070d2" opacity="0.4" />
      <rect x="80" y="105" width="12" height="16" rx="2" fill="#0070d2" opacity="0.4" />
      <rect x="108" y="105" width="12" height="16" rx="2" fill="#0070d2" opacity="0.4" />

      {/* People icons */}
      <circle cx="50" cy="100" r="12" fill="#0070d2" opacity="0.6" />
      <circle cx="50" cy="95" r="5" fill="white" />
      <path d="M42 108 Q50 100 58 108" fill="white" opacity="0.8" />

      <circle cx="150" cy="90" r="12" fill="#0070d2" opacity="0.6" />
      <circle cx="150" cy="85" r="5" fill="white" />
      <path d="M142 98 Q150 90 158 98" fill="white" opacity="0.8" />

      {/* Connection lines */}
      <line x1="62" y1="100" x2="70" y2="100" stroke="#0070d2" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />
      <line x1="130" y1="90" x2="138" y2="90" stroke="#0070d2" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />

      {/* Ground */}
      <path d="M0 140 Q50 135 100 140 Q150 145 200 140 L200 160 L0 160 Z" fill="#e2e8f0" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Calendar */}
      <rect x="50" y="40" width="100" height="90" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="50" y="40" width="100" height="25" rx="6" fill="#0070d2" opacity="0.9" />
      <circle cx="70" cy="40" r="4" fill="#e2e8f0" />
      <circle cx="130" cy="40" r="4" fill="#e2e8f0" />

      {/* Calendar grid */}
      <g fill="#94a3b8" fontSize="8" fontFamily="system-ui">
        <text x="62" y="80">M</text>
        <text x="80" y="80">T</text>
        <text x="98" y="80">W</text>
        <text x="116" y="80">T</text>
        <text x="134" y="80">F</text>
      </g>

      {/* Dates */}
      <circle cx="100" cy="100" r="10" fill="#0070d2" opacity="0.2" />
      <text x="97" y="104" fill="#0070d2" fontSize="10" fontFamily="system-ui" fontWeight="600">15</text>

      {/* Floating elements */}
      <g className="animate-float" style={{ animationDelay: '0.5s' }}>
        <rect x="155" y="50" width="30" height="8" rx="2" fill="#0070d2" opacity="0.3" />
        <rect x="155" y="62" width="20" height="8" rx="2" fill="#0070d2" opacity="0.2" />
      </g>

      <g className="animate-float" style={{ animationDelay: '1s' }}>
        <rect x="15" y="70" width="25" height="8" rx="2" fill="#0070d2" opacity="0.3" />
        <rect x="15" y="82" width="18" height="8" rx="2" fill="#0070d2" opacity="0.2" />
      </g>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Magnifying glass */}
      <circle cx="90" cy="70" r="35" fill="none" stroke="#0070d2" strokeWidth="4" opacity="0.3" />
      <circle cx="90" cy="70" r="25" fill="#0070d2" opacity="0.1" />
      <line x1="115" y1="95" x2="140" y2="120" stroke="#0070d2" strokeWidth="6" strokeLinecap="round" opacity="0.3" />

      {/* Question mark */}
      <text x="82" y="80" fill="#0070d2" fontSize="30" fontFamily="system-ui" fontWeight="600" opacity="0.6">?</text>

      {/* Floating dots */}
      <circle cx="40" cy="50" r="4" fill="#0070d2" opacity="0.2" className="animate-pulse-soft" />
      <circle cx="160" cy="40" r="3" fill="#0070d2" opacity="0.3" className="animate-pulse-soft" />
      <circle cx="170" cy="100" r="5" fill="#0070d2" opacity="0.2" className="animate-pulse-soft" />
      <circle cx="30" cy="110" r="4" fill="#0070d2" opacity="0.25" className="animate-pulse-soft" />
    </svg>
  );
}

function GenericIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Folder */}
      <path d="M40 50 L40 130 L160 130 L160 60 L100 60 L90 50 Z" fill="#0070d2" opacity="0.15" />
      <path d="M40 60 L40 130 L160 130 L160 60 Z" fill="#0070d2" opacity="0.1" />

      {/* Documents */}
      <rect x="70" y="75" width="40" height="45" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="78" y1="85" x2="102" y2="85" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="78" y1="93" x2="98" y2="93" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="78" y1="101" x2="100" y2="101" stroke="#e2e8f0" strokeWidth="2" />

      <rect x="90" y="70" width="40" height="45" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="98" y1="80" x2="122" y2="80" stroke="#0070d2" strokeWidth="2" opacity="0.4" />
      <line x1="98" y1="88" x2="118" y2="88" stroke="#0070d2" strokeWidth="2" opacity="0.3" />
      <line x1="98" y1="96" x2="120" y2="96" stroke="#0070d2" strokeWidth="2" opacity="0.2" />

      {/* Sparkles */}
      <circle cx="150" cy="45" r="3" fill="#0070d2" opacity="0.4" className="animate-pulse-soft" />
      <circle cx="50" cy="40" r="2" fill="#0070d2" opacity="0.3" className="animate-pulse-soft" />
    </svg>
  );
}

function FilesIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Cloud upload */}
      <path d="M60 90 Q60 60 100 60 Q140 60 140 90" fill="none" stroke="#0070d2" strokeWidth="3" opacity="0.3" />
      <ellipse cx="100" cy="90" rx="45" ry="20" fill="#0070d2" opacity="0.1" />

      {/* Upload arrow */}
      <line x1="100" y1="110" x2="100" y2="75" stroke="#0070d2" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <polyline points="85,90 100,75 115,90" fill="none" stroke="#0070d2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

      {/* File icons */}
      <rect x="45" y="115" width="25" height="30" rx="2" fill="#0070d2" opacity="0.2" />
      <rect x="85" y="115" width="25" height="30" rx="2" fill="#0070d2" opacity="0.15" />
      <rect x="125" y="115" width="25" height="30" rx="2" fill="#0070d2" opacity="0.1" />
    </svg>
  );
}

function CompaniesIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="160" fill="#f8fafc" rx="8" />

      {/* Buildings */}
      <rect x="40" y="60" width="40" height="80" rx="3" fill="#0070d2" opacity="0.2" />
      <rect x="48" y="70" width="10" height="12" rx="1" fill="white" />
      <rect x="62" y="70" width="10" height="12" rx="1" fill="white" />
      <rect x="48" y="88" width="10" height="12" rx="1" fill="white" />
      <rect x="62" y="88" width="10" height="12" rx="1" fill="white" />
      <rect x="48" y="106" width="10" height="12" rx="1" fill="white" />
      <rect x="62" y="106" width="10" height="12" rx="1" fill="white" />

      <rect x="90" y="40" width="50" height="100" rx="3" fill="#0070d2" opacity="0.3" />
      <rect x="100" y="50" width="12" height="14" rx="1" fill="white" />
      <rect x="118" y="50" width="12" height="14" rx="1" fill="white" />
      <rect x="100" y="70" width="12" height="14" rx="1" fill="white" />
      <rect x="118" y="70" width="12" height="14" rx="1" fill="white" />
      <rect x="100" y="90" width="12" height="14" rx="1" fill="white" />
      <rect x="118" y="90" width="12" height="14" rx="1" fill="white" />
      <rect x="100" y="110" width="12" height="14" rx="1" fill="white" />
      <rect x="118" y="110" width="12" height="14" rx="1" fill="white" />

      <rect x="150" y="80" width="30" height="60" rx="3" fill="#0070d2" opacity="0.15" />
      <rect x="156" y="88" width="8" height="10" rx="1" fill="white" />
      <rect x="166" y="88" width="8" height="10" rx="1" fill="white" />
      <rect x="156" y="104" width="8" height="10" rx="1" fill="white" />
      <rect x="166" y="104" width="8" height="10" rx="1" fill="white" />

      {/* Ground */}
      <rect x="0" y="140" width="200" height="20" fill="#e2e8f0" />
    </svg>
  );
}

const illustrations: Record<IllustrationType, React.FC> = {
  contacts: ContactsIllustration,
  companies: CompaniesIllustration,
  calendar: CalendarIllustration,
  search: SearchIllustration,
  files: FilesIllustration,
  generic: GenericIllustration,
};

const defaultIcons: Record<IllustrationType, LucideIcon> = {
  contacts: Users,
  companies: Building2,
  calendar: Calendar,
  search: Search,
  files: FolderOpen,
  generic: FileQuestion,
};

export function EmptyState({
  title,
  description,
  icon,
  illustration = 'generic',
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const IllustrationComponent = illustrations[illustration];
  const DefaultIcon = icon || defaultIcons[illustration];
  const ActionIcon = primaryAction?.icon || Plus;

  return (
    <div className={cn('empty-state', className)}>
      {/* Illustration */}
      <div className="empty-state-illustration">
        <IllustrationComponent />
      </div>

      {/* Icon fallback if no illustration needed */}
      {!illustration && (
        <div className="empty-state-icon">
          <DefaultIcon />
        </div>
      )}

      {/* Content */}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="gap-2">
              <ActionIcon className="h-4 w-4" />
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
