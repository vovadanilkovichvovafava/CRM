'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SlideOver({
  isOpen,
  onClose,
  title,
  children,
  width = 'lg',
}: SlideOverProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full ${widthClasses[width]} bg-[#0a0a0f] border-l border-white/10 shadow-2xl animate-slide-in-right`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="h-full overflow-y-auto pb-20">
          {!title && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white z-10"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
