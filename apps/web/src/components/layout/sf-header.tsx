'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUISettingsStore } from '@/stores/ui-settings';
import { useAuthStore } from '@/stores/auth';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/use-notifications';
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  Plus,
  Star,
  LogOut,
  User,
  Grid3X3,
  X,
  Home,
  Users,
  Building2,
  DollarSign,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Globe,
  Handshake,
  BarChart3,
  Workflow,
  Clock,
  Mail,
  Upload,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Users,
  Building2,
  DollarSign,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Globe,
  Handshake,
  BarChart3,
  Workflow,
  Clock,
  Mail,
  Upload,
  Settings,
};

function SalesforceLogo({ className = 'w-10 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A1E0" />
          <stop offset="100%" stopColor="#0070D2" />
        </linearGradient>
      </defs>
      <path
        d="M20 6c-4.4 0-8 3.1-9.2 7.2C9.6 12.4 8.3 12 7 12c-4.4 0-8 3.6-8 8s3.6 8 8 8h32c4.4 0 8-3.6 8-8 0-4-3-7.4-7-7.9C39 7.8 35.1 4 30.5 4c-3.1 0-5.8 1.7-7.3 4.2C22 7.4 21 7 20 7V6z"
        fill="url(#cloudGradient)"
      />
    </svg>
  );
}

function JanusLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerJanusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0070D2" />
          <stop offset="50%" stopColor="#1589EE" />
          <stop offset="100%" stopColor="#00A1E0" />
        </linearGradient>
        <linearGradient id="headerJanusGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00A1E0" />
          <stop offset="100%" stopColor="#0070D2" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#headerJanusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#headerJanusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="24" y1="8" x2="24" y2="40" stroke="url(#headerJanusGradient)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="url(#headerJanusGradient2)" />
      <circle cx="32" cy="20" r="3" fill="url(#headerJanusGradient)" />
      <circle cx="24" cy="32" r="4" fill="url(#headerJanusGradient)" />
    </svg>
  );
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-20 w-full max-w-2xl -translate-x-1/2 animate-fade-in-down">
        <div className="sf-card overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder', 'Search Janus...')}
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400"
            />
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">{t('nav.searchHint', 'Type to search contacts, companies, deals...')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

function AppLauncher({ isOpen, onClose }: AppLauncherProps) {
  const { t } = useTranslation();
  const { settings } = useUISettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute left-4 top-14 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sf-card w-80 overflow-hidden shadow-2xl">
          <div className="border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">{t('nav.appLauncher', 'App Launcher')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4">
            {settings.navTabs.map((tab) => {
              const Icon = iconMap[tab.icon] || Home;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 transition-all duration-150 hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070D2] to-[#00A1E0]">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">
                    {t(tab.labelKey, tab.label)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationsPopover({ isOpen, onClose }: NotificationsPopoverProps) {
  const { t } = useTranslation();
  const { data: notifications = [] } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute right-20 top-14 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sf-card w-96 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">{t('notifications.title', 'Notifications')}</h3>
            {unreadNotifications.length > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-sm text-[#0070D2] transition-colors hover:text-[#005fb2]"
              >
                {t('notifications.markAllRead', 'Mark all as read')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">{t('notifications.empty', 'No notifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className={cn(
                      'w-full p-4 text-left transition-colors hover:bg-gray-50',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#0070D2]" />
                      )}
                      <div className={cn('flex-1', notification.isRead && 'ml-5')}>
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute right-4 top-14 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sf-card w-72 overflow-hidden shadow-2xl">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0070D2] to-[#00A1E0]">
                  <span className="text-lg font-semibold text-white uppercase">{userInitial}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name || t('common.user')}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">{t('nav.profile', 'My Profile')}</span>
            </Link>
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">{t('nav.settings', 'Settings')}</span>
            </Link>
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">{t('common.logout', 'Log Out')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SFHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { settings } = useUISettingsStore();
  const { user } = useAuthStore();
  const { data: notifications = [] } = useNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const visibleTabs = settings.navTabs.filter((tab) => tab.visible).sort((a, b) => a.order - b.order);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'U';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4">
        {/* Left section: App launcher + Logo + Service selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAppLauncherOpen(true)}
            className="rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <JanusLogo className="h-8 w-8" />
          </Link>

          <div className="ml-2 flex items-center gap-1 text-gray-700">
            <span className="font-semibold">Service</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {/* Center section: Navigation tabs */}
        <nav className="ml-6 flex h-full items-center gap-1">
          {visibleTabs.slice(0, 8).map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'relative flex h-full items-center px-4 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-[#0070D2]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {t(tab.labelKey, tab.label)}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0070D2] animate-scale-in" />
                )}
              </Link>
            );
          })}
          {visibleTabs.length > 8 && (
            <button className="flex h-full items-center gap-1 px-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              {t('nav.more', 'More')}
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </nav>

        {/* Right section: Search + Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-1.5 text-sm text-gray-500 transition-all duration-150 hover:border-gray-400 hover:bg-white"
          >
            <Search className="h-4 w-4" />
            <span>{t('nav.search', 'Search')}...</span>
            <kbd className="ml-4 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500">
              ⌘K
            </kbd>
          </button>

          {/* Quick actions */}
          <button className="flex items-center gap-1 rounded-md bg-[#0070D2] px-3 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#005fb2] active:scale-95">
            <Plus className="h-4 w-4" />
          </button>

          {/* Favorites */}
          <button className="rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-gray-100">
            <Star className="h-5 w-5" />
          </button>

          {/* Help */}
          <button className="rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-gray-100">
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-scale-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className="flex items-center gap-2 rounded-full transition-all duration-150 hover:ring-2 hover:ring-gray-200"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0070D2] to-[#00A1E0]">
                <span className="text-sm font-semibold text-white uppercase">{userInitial}</span>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AppLauncher isOpen={isAppLauncherOpen} onClose={() => setIsAppLauncherOpen(false)} />
      <NotificationsPopover isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <UserMenu isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} />
    </>
  );
}
