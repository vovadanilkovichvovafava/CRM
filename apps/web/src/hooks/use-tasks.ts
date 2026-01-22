'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, PaginatedResponse } from '@/types';

interface TasksParams {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useTasks(params?: TasksParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => api.tasks.list(params) as Promise<PaginatedResponse<Task>>,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.tasks.get(id) as Promise<Task>,
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task>) => api.tasks.create(data),
    onSuccess: () => {
      // Invalidate all task queries regardless of params
      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'all' });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.tasks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: string; position: number }) =>
      api.tasks.move(id, status, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
