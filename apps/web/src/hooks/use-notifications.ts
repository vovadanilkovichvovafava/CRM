'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', options],
    queryFn: () => api.notifications.list(options) as Promise<Notification[]>,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Helper to get notification icon based on type
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'task_assigned':
      return 'user-plus';
    case 'task_status_changed':
      return 'refresh-cw';
    case 'task_due_soon':
      return 'clock';
    case 'comment_added':
      return 'message-circle';
    case 'comment_reply':
      return 'reply';
    case 'comment_mention':
      return 'at-sign';
    case 'record_created':
      return 'plus-circle';
    default:
      return 'bell';
  }
}

// Helper to get notification color based on type
export function getNotificationColor(type: string): string {
  switch (type) {
    case 'task_assigned':
      return 'text-blue-400';
    case 'task_status_changed':
      return 'text-yellow-400';
    case 'task_due_soon':
      return 'text-orange-400';
    case 'comment_added':
    case 'comment_reply':
      return 'text-green-400';
    case 'comment_mention':
      return 'text-indigo-400';
    default:
      return 'text-white/60';
  }
}
