'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Loader2,
  Check,
  CheckCheck,
  Trash2,
  X,
  User,
  FileText,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'task_assigned':
    case 'task_due_soon':
      return <Clock className="h-4 w-4 text-amber-400" />;
    case 'comment_mention':
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case 'record_created':
      return <FileText className="h-4 w-4 text-emerald-400" />;
    default:
      return <Bell className="h-4 w-4 text-violet-400" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get notifications when dropdown is open
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => api.notifications.list({ limit: 20 }),
    enabled: isOpen,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = countData?.count || 0;

  const handleNotificationClick = (notification: Notification) => {
    console.log('[NotificationBell] Click notification:', {
      id: notification.id,
      type: notification.type,
      data: notification.data,
    });

    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type and data
    const data = notification.data as {
      taskId?: string;
      recordId?: string;
      objectId?: string;
      objectName?: string;
    } | null;

    if (data?.taskId) {
      // Task-related notifications - navigate directly to task detail page
      console.log('[NotificationBell] Navigating to task:', data.taskId);
      setIsOpen(false);
      router.push(`/tasks/${data.taskId}`);
      return;
    }

    if (data?.recordId && data?.objectName) {
      // Record-related notifications - navigate to the specific entity page
      console.log('[NotificationBell] Navigating to record:', data.recordId, 'object:', data.objectName);
      setIsOpen(false);
      // Map object names to routes
      const objectRoutes: Record<string, string> = {
        contacts: 'contacts',
        companies: 'companies',
        deals: 'deals',
        webmasters: 'webmasters',
        partners: 'partners',
      };
      const route = objectRoutes[data.objectName] || data.objectName;
      router.push(`/${route}/${data.recordId}`);
      return;
    }

    console.log('[NotificationBell] No navigation - data does not contain taskId or recordId/objectName');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="h-7 px-2 text-xs text-white/50 hover:text-white"
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3 mr-1" />
                  )}
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex gap-3 p-3 cursor-pointer transition-colors hover:bg-white/5',
                      !notification.isRead && 'bg-violet-500/5'
                    )}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          notification.isRead ? 'text-white/70' : 'text-white font-medium'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      className="flex-shrink-0 rounded p-1 text-white/20 hover:bg-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-white/50 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
