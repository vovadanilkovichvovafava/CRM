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
  Home,
  Search,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

function JanusLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sidebarJanusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="sidebarJanusGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#sidebarJanusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#sidebarJanusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="24" y1="8" x2="24" y2="40" stroke="url(#sidebarJanusGradient)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="url(#sidebarJanusGradient2)" />
      <circle cx="32" cy="20" r="3" fill="url(#sidebarJanusGradient)" />
      <circle cx="24" cy="32" r="4" fill="url(#sidebarJanusGradient)" />
    </svg>
  );
}

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
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0a0a0f] border-r border-white/5">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <Link href="/" className="flex items-center gap-3">
          <JanusLogo className="h-9 w-9" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Janus</span>
            <span className="text-[10px] text-white/40 -mt-1">See everything</span>
          </div>
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

      {/* Bottom section - User info */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
              <span className="text-sm font-semibold text-white uppercase">{userInitial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-white/40 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
