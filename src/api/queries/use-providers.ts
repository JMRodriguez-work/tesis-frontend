import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { providerKeys } from '@/lib/query-keys';
import type {
  CreateProviderInput,
  ListProvidersQuery,
  UpdateProviderInput,
} from '@/lib/schemas/provider';

type ProvidersListResponse = NonNullable<
  paths['/api/v1/providers']['get']['responses']['200']['content']['application/json']
>;
export type Provider = ProvidersListResponse['data']['data'][number];
export type ProvidersList = {
  data: Provider[];
  meta: ProvidersListResponse['data']['meta'];
};

type CreateProviderBody = NonNullable<
  NonNullable<paths['/api/v1/providers']['post']['requestBody']>['content']['application/json']
>;
type UpdateProviderBody = NonNullable<
  NonNullable<paths['/api/v1/providers/{id}']['put']['requestBody']>['content']['application/json']
>;

export function useProviders(query: Partial<ListProvidersQuery> = {}) {
  return useQuery<ProvidersList>({
    queryKey: providerKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: 20,
        ...(query.search ? { search: query.search } : {}),
        ...(query.showInactive !== undefined ? { isActive: !query.showInactive } : {}),
      };
      const { data, error } = await api.GET('/api/v1/providers', {
        params: { query: apiQuery as ListProvidersQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch providers');
      return data.data;
    },
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: providerKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/providers/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch provider');
      return data.data as Provider;
    },
    enabled: id.length > 0,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body }: { body: CreateProviderInput }): Promise<Provider> => {
      const cleanBody: Record<string, unknown> = { name: body.name };
      if (body.companyName) cleanBody.companyName = body.companyName;
      if (body.contactName) cleanBody.contactName = body.contactName;
      if (body.contactEmail) cleanBody.contactEmail = body.contactEmail;
      if (body.contactPhone) cleanBody.contactPhone = body.contactPhone;
      const { data, error } = await api.POST('/api/v1/providers', {
        body: cleanBody as CreateProviderBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create provider');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateProviderInput;
    }): Promise<Provider> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/providers/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateProviderBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update provider');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
      qc.invalidateQueries({ queryKey: providerKeys.detail(id) });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/providers/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}
