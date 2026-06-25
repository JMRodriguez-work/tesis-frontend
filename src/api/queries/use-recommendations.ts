import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { notificationKeys, recommendationKeys } from '@/lib/query-keys';

type RecommendationsListResponse = NonNullable<
  paths['/api/v1/recommendations']['get']['responses']['200']['content']['application/json']
>;
export type RecommendationListRow = RecommendationsListResponse['data']['data'][number];
export type RecommendationsList = {
  data: RecommendationListRow[];
  meta: RecommendationsListResponse['data']['meta'];
};
export type RecommendationType = RecommendationListRow['type'];
export type RecommendationPriority = RecommendationListRow['priority'];
export type RecommendationStatus = RecommendationListRow['status'];

type RecommendationDetailResponse = NonNullable<
  paths['/api/v1/recommendations/{id}']['get']['responses']['200']['content']['application/json']
>;
export type RecommendationDetail = RecommendationDetailResponse['data'];

type UpdateStatusBody = NonNullable<
  NonNullable<
    paths['/api/v1/recommendations/{id}/status']['patch']['requestBody']
  >['content']['application/json']
>;

type UseRecommendationsQuery = {
  page?: number;
  limit?: number;
  type?: RecommendationType | null;
  status?: RecommendationStatus | null;
  itemId?: string;
  branchId?: string;
};

export function useRecommendations(
  query: UseRecommendationsQuery = {},
  options?: Pick<UseQueryOptions<RecommendationsList>, 'enabled'>,
): ReturnType<typeof useQuery<RecommendationsList>> {
  return useQuery<RecommendationsList>({
    queryKey: recommendationKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/recommendations', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch recommendations');
      return data.data;
    },
    ...options,
  });
}

export function useRecommendation(id: string) {
  return useQuery({
    queryKey: recommendationKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/recommendations/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch recommendation');
      return data.data as RecommendationDetail;
    },
    enabled: id.length > 0,
  });
}

export function useUpdateRecommendationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Exclude<RecommendationStatus, 'pending'>;
    }): Promise<RecommendationDetail> => {
      const apiBody: UpdateStatusBody = { status };
      const { data, error } = await api.PATCH('/api/v1/recommendations/{id}/status', {
        params: { path: { id } },
        body: apiBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update recommendation status');
      return data.data as RecommendationDetail;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: recommendationKeys.lists() });
      qc.invalidateQueries({ queryKey: recommendationKeys.detail(id) });
      qc.invalidateQueries({ queryKey: notificationKeys.unread({}) });
    },
  });
}
