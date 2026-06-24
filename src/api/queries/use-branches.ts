import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { branchKeys } from '@/lib/query-keys';
import type { CreateBranchInput, ListBranchesQuery, UpdateBranchInput } from '@/lib/schemas/branch';

type BranchesListResponse = NonNullable<
  paths['/api/v1/branches']['get']['responses']['200']['content']['application/json']
>;
type BranchDetailResponse = NonNullable<
  paths['/api/v1/branches/{id}']['get']['responses']['200']['content']['application/json']
>;
type BranchItem = BranchesListResponse['data']['data'][number];
export type BranchesList = { data: BranchItem[]; meta: BranchesListResponse['data']['meta'] };

export function useBranches(query: Partial<ListBranchesQuery> = {}) {
  return useQuery<BranchesList>({
    queryKey: branchKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/branches', {
        params: { query: query as ListBranchesQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch branches');
      return data.data;
    },
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/branches/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch branch');
      return data.data as BranchDetailResponse['data'];
    },
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateBranchInput) => {
      const { data, error } = await api.POST('/api/v1/branches', { body });
      if (error || !data) throw error ?? new Error('Failed to create branch');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateBranchInput }) => {
      const { data, error } = await api.PUT('/api/v1/branches/{id}', {
        params: { path: { id } },
        body,
      });
      if (error || !data) throw error ?? new Error('Failed to update branch');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: branchKeys.lists() });
      qc.invalidateQueries({ queryKey: branchKeys.detail(id) });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/branches/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export type { BranchItem };
