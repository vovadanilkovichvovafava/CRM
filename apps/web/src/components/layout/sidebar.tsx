'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  DollarSign,
  Globe,
  Handshake,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Sparkles,
  Home,
  Search,
  Bell,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}

const mainItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
];

const systemObjects: NavItem[] = [
  { name: 'Contacts', href: '/contacts', icon: Users, colorClass: 'text-blue-400' },
  { name: 'Companies', href: '/companies', icon: Building2, colorClass: 'text-emerald-400' },
  { name: 'Deals', href: '/deals', icon: DollarSign, colorClass: 'text-amber-400' },
  { name: 'Webmasters', href: '/webmasters', icon: Globe, colorClass: 'text-violet-400' },
  { name: 'Partners', href: '/partners', icon: Handshake, colorClass: 'text-pink-400' },
];

const pmItems: NavItem[] = [
  { name: 'Projects', href: '/projects', icon: FolderKanban, colorClass: 'text-cyan-400' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, colorClass: 'text-lime-400' },
];

const otherItems: NavItem[] = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function NavSection({
  title,
  items,
  showAddButton,
  pathname,
}: {
  title?: string;
  items: NavItem[];
  showAddButton?: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-6">
      {title && (
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            {title}
          </span>
          {showAddButton && (
            <button className="rounded p-0.5 text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : item.colorClass
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0a0a0f] border-r border-white/5">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Nexus</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/10 hover:text-white/60">
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/30">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <NavSection items={mainItems} pathname={pathname} />
        <NavSection title="CRM" items={systemObjects} showAddButton pathname={pathname} />
        <NavSection title="Projects" items={pmItems} pathname={pathname} />
        <NavSection items={otherItems} pathname={pathname} />
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500">
            <span className="text-sm font-semibold text-white">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User</p>
            <p className="text-xs text-white/40 truncate">user@example.com</p>
          </div>
          <button className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
