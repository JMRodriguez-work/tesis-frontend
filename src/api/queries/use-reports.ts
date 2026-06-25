import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { reportKeys } from '@/lib/query-keys';

type SalesTrendResponse = NonNullable<
  paths['/api/v1/reports/sales-trend']['get']['responses']['200']['content']['application/json']
>;
export type SalesTrendBucket = SalesTrendResponse['data']['data'][number];
export type SalesTrendData = {
  data: SalesTrendBucket[];
  interval: 'day' | 'week' | 'month';
  from: string;
  to: string;
  meta: { total: number };
};

type RevenueTimelineResponse = NonNullable<
  paths['/api/v1/reports/revenue-timeline']['get']['responses']['200']['content']['application/json']
>;
export type RevenueTimelineBucket = RevenueTimelineResponse['data']['data'][number];
export type RevenueTimelineData = {
  data: RevenueTimelineBucket[];
  interval: 'day' | 'week' | 'month';
  from: string;
  to: string;
  meta: { total: number };
};

type TopItemsResponse = NonNullable<
  paths['/api/v1/reports/top-items']['get']['responses']['200']['content']['application/json']
>;
export type TopItem = TopItemsResponse['data']['data'][number];
export type TopItemsData = {
  data: TopItem[];
  meta: TopItemsResponse['data']['meta'];
};

type CategoryDistributionResponse = NonNullable<
  paths['/api/v1/reports/category-distribution']['get']['responses']['200']['content']['application/json']
>;
export type CategorySlice = CategoryDistributionResponse['data']['data'][number];
export type CategoryDistributionData = {
  data: CategorySlice[];
  meta: CategoryDistributionResponse['data']['meta'];
};

type UseSalesTrendQuery = {
  from?: string | null;
  to?: string | null;
  interval: 'day' | 'week' | 'month';
  branchId?: string;
};

export function useSalesTrend(
  query: UseSalesTrendQuery,
  options?: Pick<UseQueryOptions<SalesTrendData>, 'enabled'>,
): ReturnType<typeof useQuery<SalesTrendData>> {
  return useQuery<SalesTrendData>({
    queryKey: reportKeys.salesTrend(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        interval: query.interval,
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/reports/sales-trend', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch sales trend');
      return data.data;
    },
    ...options,
  });
}

type UseRevenueTimelineQuery = {
  from?: string | null;
  to?: string | null;
  interval: 'day' | 'week' | 'month';
  branchId?: string;
};

export function useRevenueTimeline(
  query: UseRevenueTimelineQuery,
  options?: Pick<UseQueryOptions<RevenueTimelineData>, 'enabled'>,
): ReturnType<typeof useQuery<RevenueTimelineData>> {
  return useQuery<RevenueTimelineData>({
    queryKey: reportKeys.revenueTimeline(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        interval: query.interval,
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/reports/revenue-timeline', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch revenue timeline');
      return data.data;
    },
    ...options,
  });
}

type UseTopItemsQuery = {
  from?: string | null;
  to?: string | null;
  sortBy?: 'quantity' | 'revenue' | null;
  limit?: number;
  branchId?: string;
};

export function useTopItems(
  query: UseTopItemsQuery = {},
  options?: Pick<UseQueryOptions<TopItemsData>, 'enabled'>,
): ReturnType<typeof useQuery<TopItemsData>> {
  return useQuery<TopItemsData>({
    queryKey: reportKeys.topItems(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.sortBy ? { sortBy: query.sortBy } : {}),
        ...(query.limit ? { limit: query.limit } : { limit: 20 }),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/reports/top-items', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch top items');
      return data.data;
    },
    ...options,
  });
}

type UseCategoryDistributionQuery = {
  from?: string | null;
  to?: string | null;
  branchId?: string;
};

export function useCategoryDistribution(
  query: UseCategoryDistributionQuery = {},
  options?: Pick<UseQueryOptions<CategoryDistributionData>, 'enabled'>,
): ReturnType<typeof useQuery<CategoryDistributionData>> {
  return useQuery<CategoryDistributionData>({
    queryKey: reportKeys.categoryDistribution(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/reports/category-distribution', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch category distribution');
      return data.data;
    },
    ...options,
  });
}
