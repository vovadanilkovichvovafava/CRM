'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CrmObject, PaginatedResponse } from '@/types';

export function useObjects(params?: { type?: string; includeArchived?: boolean }) {
  return useQuery({
    queryKey: ['objects', params],
    queryFn: () => api.objects.list(params) as Promise<PaginatedResponse<CrmObject>>,
  });
}

export function useObject(id: string) {
  return useQuery({
    queryKey: ['objects', id],
    queryFn: () => api.objects.get(id) as Promise<CrmObject>,
    enabled: !!id,
  });
}

export function useObjectByName(name: string) {
  return useQuery({
    queryKey: ['objects', 'by-name', name],
    queryFn: () => api.objects.getByName(name) as Promise<CrmObject>,
    enabled: !!name,
  });
}

export function useCreateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CrmObject>) => api.objects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
}

export function useUpdateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmObject> }) =>
      api.objects.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      queryClient.invalidateQueries({ queryKey: ['objects', id] });
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.objects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
}
