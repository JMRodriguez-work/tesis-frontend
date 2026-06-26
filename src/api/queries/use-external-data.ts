import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { externalDataKeys } from '@/lib/query-keys';
import type {
  CreateExternalDataSourceInput,
  ListExternalDataSourcesQuery,
  UpdateExternalDataSourceInput,
} from '@/lib/schemas/external-data';

type ExternalDataListResponse = NonNullable<
  paths['/api/v1/external-data']['get']['responses']['200']['content']['application/json']
>;
export type ExternalDataSource = ExternalDataListResponse['data']['data'][number];
export type ExternalDataSourcesList = {
  data: ExternalDataSource[];
  meta: ExternalDataListResponse['data']['meta'];
};

type CreateExternalDataSourceBody = NonNullable<
  NonNullable<paths['/api/v1/external-data']['post']['requestBody']>['content']['application/json']
>;
type UpdateExternalDataSourceBody = NonNullable<
  NonNullable<
    paths['/api/v1/external-data/{id}']['put']['requestBody']
  >['content']['application/json']
>;

export function useExternalDataSources(query: Partial<ListExternalDataSourcesQuery> = {}) {
  return useQuery<ExternalDataSourcesList>({
    queryKey: externalDataKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      };
      if (query.isActive !== null && query.isActive !== undefined) {
        apiQuery.isActive = query.isActive ? 'true' : 'false';
      }
      if (query.type) {
        apiQuery.type = query.type;
      }
      const { data, error } = await api.GET('/api/v1/external-data', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch external data sources');
      return data.data;
    },
  });
}

export function useExternalDataSource(id: string) {
  return useQuery({
    queryKey: externalDataKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/external-data/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch external data source');
      return data.data as ExternalDataSource;
    },
    enabled: id.length > 0,
  });
}

export function useCreateExternalDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
    }: {
      body: CreateExternalDataSourceInput;
    }): Promise<ExternalDataSource> => {
      const cleanBody: Record<string, unknown> = {
        name: body.name,
        type: body.type,
      };
      if (body.url !== undefined) cleanBody.url = body.url;
      if (body.authConfigJson !== undefined) cleanBody.authConfig = body.authConfigJson;
      if (body.isActive !== undefined) cleanBody.isActive = body.isActive;
      const { data, error } = await api.POST('/api/v1/external-data', {
        body: cleanBody as CreateExternalDataSourceBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create external data source');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalDataKeys.lists() });
    },
  });
}

export function useUpdateExternalDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateExternalDataSourceInput;
    }): Promise<ExternalDataSource> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (key === 'authConfigJson') {
          if (value !== undefined && value !== null) {
            cleanBody.authConfig = value;
          }
          continue;
        }
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/external-data/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateExternalDataSourceBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update external data source');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: externalDataKeys.lists() });
      qc.invalidateQueries({ queryKey: externalDataKeys.detail(id) });
    },
  });
}

export function useDeleteExternalDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/external-data/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalDataKeys.lists() });
    },
  });
}

export function useEnqueueFetchExternalData() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/external-data/{id}/fetch', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to enqueue fetch');
      return data.data;
    },
  });
}
