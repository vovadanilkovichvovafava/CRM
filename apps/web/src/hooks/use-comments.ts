'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
  id: string;
  content: string;
  taskId?: string;
  recordId?: string;
  authorId: string;
  author?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', 'task', taskId],
    queryFn: () => api.comments.listByTask(taskId) as Promise<Comment[]>,
    enabled: !!taskId,
  });
}

export function useRecordComments(recordId: string) {
  return useQuery({
    queryKey: ['comments', 'record', recordId],
    queryFn: () => api.comments.listByRecord(recordId) as Promise<Comment[]>,
    enabled: !!recordId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { content: string; taskId?: string; recordId?: string }) =>
      api.comments.create(data),
    onSuccess: (_, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'task', variables.taskId] });
      }
      if (variables.recordId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'record', variables.recordId] });
      }
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.comments.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
