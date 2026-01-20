'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CrmRecord, PaginatedResponse } from '@/types';

interface RecordsParams {
  objectId?: string;
  ownerId?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useRecords(params?: RecordsParams) {
  return useQuery({
    queryKey: ['records', params],
    queryFn: () => api.records.list(params) as Promise<PaginatedResponse<CrmRecord>>,
  });
}

export function useRecord(id: string, include?: string[]) {
  return useQuery({
    queryKey: ['records', id, include],
    queryFn: () => api.records.get(id, include) as Promise<CrmRecord>,
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { objectId: string; data: unknown; stage?: string }) =>
      api.records.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.records.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['records', id] });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}
