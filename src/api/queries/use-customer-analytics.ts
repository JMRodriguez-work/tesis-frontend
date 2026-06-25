import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import {
  customerAnalyticsKeys,
  customerSegmentKeys,
  dashboardKeys,
  notificationKeys,
  recommendationKeys,
} from '@/lib/query-keys';
import type { CustomerSegment } from '@/lib/schemas/customer-analytics';

type CustomerSegmentsResponse = NonNullable<
  paths['/api/v1/customers/segments']['get']['responses']['200']['content']['application/json']
>;
export type CustomerSegmentRow = CustomerSegmentsResponse['data']['data'][number];
export type CustomerSegmentsList = {
  data: CustomerSegmentRow[];
  meta: CustomerSegmentsResponse['data']['meta'];
};

type DetectInactiveResponse = NonNullable<
  paths['/api/v1/customer-analytics/detect-inactive']['post']['responses']['202']['content']['application/json']
>;

type UseCustomerSegmentsQuery = {
  page?: number;
  limit?: number;
  segment?: CustomerSegment | null;
  branchId?: string;
};

export function useCustomerSegments(
  query: UseCustomerSegmentsQuery = {},
  options?: Pick<UseQueryOptions<CustomerSegmentsList>, 'enabled'>,
): ReturnType<typeof useQuery<CustomerSegmentsList>> {
  return useQuery<CustomerSegmentsList>({
    queryKey: customerSegmentKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.segment ? { segment: query.segment } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/customers/segments', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch customer segments');
      return data.data;
    },
    ...options,
  });
}

type DetectInactiveBody = {
  days: number;
  branchId?: string;
};

export function useDetectInactiveCustomers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: DetectInactiveBody): Promise<DetectInactiveResponse['data']> => {
      const apiBody: Record<string, unknown> = {
        days: body.days,
        ...(body.branchId ? { branchId: body.branchId } : {}),
      };
      const { data, error } = await api.POST('/api/v1/customer-analytics/detect-inactive', {
        body: apiBody as never,
      });
      if (error || !data) throw error ?? new Error('Failed to enqueue detect-inactive job');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.inactiveCustomers({}) });
      qc.invalidateQueries({ queryKey: recommendationKeys.lists() });
      qc.invalidateQueries({ queryKey: notificationKeys.unread({}) });
    },
  });
}

export { customerAnalyticsKeys };
