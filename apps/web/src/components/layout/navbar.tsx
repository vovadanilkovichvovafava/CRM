'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  HelpCircle,
  ChevronRight,
  Check,
  CheckCheck,
  UserPlus,
  RefreshCw,
  Clock,
  MessageCircle,
  Reply,
  AtSign,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/use-notifications';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'task_assigned':
      return <UserPlus className="h-4 w-4 text-blue-400" />;
    case 'task_status_changed':
      return <RefreshCw className="h-4 w-4 text-yellow-400" />;
    case 'task_due_soon':
      return <Clock className="h-4 w-4 text-orange-400" />;
    case 'comment_added':
      return <MessageCircle className="h-4 w-4 text-green-400" />;
    case 'comment_reply':
      return <Reply className="h-4 w-4 text-green-400" />;
    case 'comment_mention':
      return <AtSign className="h-4 w-4 text-indigo-400" />;
    default:
      return <Bell className="h-4 w-4 text-white/60" />;
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  t,
  locale,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.isRead ? 'bg-transparent hover:bg-white/5' : 'bg-indigo-500/10 hover:bg-indigo-500/15'
      )}
      onClick={() => onClick(notification)}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', notification.isRead ? 'text-white/70' : 'text-white')}>
          {notification.title}
        </p>
        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-white/30 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: locale === 'ru' ? ru : enUS
          })}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80"
            title={t('notifications.markAllRead')}
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400"
          title={t('common.delete')}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function Navbar() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const pathNames: Record<string, string> = {
    '/dashboard': t('nav.dashboard'),
    '/contacts': t('nav.contacts'),
    '/companies': t('nav.companies'),
    '/deals': t('nav.deals'),
    '/webmasters': t('nav.webmasters'),
    '/partners': t('nav.partners'),
    '/projects': t('nav.projects'),
    '/tasks': t('nav.tasks'),
    '/analytics': t('nav.analytics'),
    '/settings': t('nav.settings'),
    '/calendar': t('nav.calendar'),
    '/time-tracking': t('nav.timeTracking'),
    '/email-templates': t('nav.emailTemplates'),
    '/automations': t('nav.automations'),
    '/import': t('nav.importData'),
  };

  const currentPage = pathNames[pathname] || t('nav.dashboard');

  const { data: notifications = [] } = useNotifications({ limit: 20 });
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data as Record<string, unknown> | null;
    if (data?.taskId) {
      router.push(`/tasks/${data.taskId}`);
      setIsOpen(false);
    } else if (data?.recordId) {
      setIsOpen(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/40">Janus</span>
        <ChevronRight className="h-4 w-4 text-white/20" />
        <span className="font-medium text-white">{currentPage}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              {(unreadCount?.count ?? 0) > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white ring-2 ring-[#0a0a0f]">
                  {unreadCount?.count && unreadCount.count > 9 ? '9+' : unreadCount?.count}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-96 p-0 bg-[#1a1a2e] border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{t('notifications.title')}</span>
                {(unreadCount?.count ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-[10px] font-medium text-indigo-400">
                    {unreadCount?.count} {t('notifications.new')}
                  </span>
                )}
              </div>
              {(unreadCount?.count ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-white/50 hover:text-white"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  {t('notifications.markAllRead')}
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      onClick={handleNotificationClick}
                      t={t}
                      locale={i18n.language}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
