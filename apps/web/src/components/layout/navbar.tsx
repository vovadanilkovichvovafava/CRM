'use client';

import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, ChevronRight } from 'lucide-react';

const pathNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contacts': 'Contacts',
  '/companies': 'Companies',
  '/deals': 'Deals',
  '/webmasters': 'Webmasters',
  '/partners': 'Partners',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function Navbar() {
  const pathname = usePathname();
  const currentPage = pathNames[pathname] || 'Dashboard';

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/40">Nexus</span>
        <ChevronRight className="h-4 w-4 text-white/20" />
        <span className="font-medium text-white">{currentPage}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0f]" />
        </button>
      </div>
    </header>
  );
}
