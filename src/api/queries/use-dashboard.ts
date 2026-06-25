import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { dashboardKeys } from '@/lib/query-keys';

type SalesSummaryResponse = NonNullable<
  paths['/api/v1/dashboard/sales-summary']['get']['responses']['200']['content']['application/json']
>;
export type SalesSummary = SalesSummaryResponse['data'];

type ProductRotationResponse = NonNullable<
  paths['/api/v1/dashboard/product-rotation']['get']['responses']['200']['content']['application/json']
>;
export type ProductRotationRow = ProductRotationResponse['data']['data'][number];
export type ProductRotationList = {
  data: ProductRotationRow[];
  meta: ProductRotationResponse['data']['meta'];
};

type InactiveCustomersResponse = NonNullable<
  paths['/api/v1/dashboard/inactive-customers']['get']['responses']['200']['content']['application/json']
>;
export type InactiveCustomer = InactiveCustomersResponse['data']['data'][number];
export type InactiveCustomersList = {
  data: InactiveCustomer[];
  meta: InactiveCustomersResponse['data']['meta'];
};

type UseSalesSummaryQuery = {
  branchId?: string;
  from?: string | null;
  to?: string | null;
};

export function useSalesSummary(
  query: UseSalesSummaryQuery = {},
  options?: Pick<UseQueryOptions<SalesSummary>, 'enabled'>,
): ReturnType<typeof useQuery<SalesSummary>> {
  return useQuery<SalesSummary>({
    queryKey: dashboardKeys.salesSummary(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      };
      const { data, error } = await api.GET('/api/v1/dashboard/sales-summary', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch sales summary');
      return data.data;
    },
    ...options,
  });
}

type UseProductRotationQuery = {
  page?: number;
  limit?: number;
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  includeZeroSales?: boolean | null;
  branchId?: string;
};

export function useProductRotation(
  query: UseProductRotationQuery = {},
  options?: Pick<UseQueryOptions<ProductRotationList>, 'enabled'>,
): ReturnType<typeof useQuery<ProductRotationList>> {
  return useQuery<ProductRotationList>({
    queryKey: dashboardKeys.productRotation(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.includeZeroSales !== null && query.includeZeroSales !== undefined
          ? { includeZeroSales: query.includeZeroSales }
          : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/dashboard/product-rotation', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch product rotation');
      return data.data;
    },
    ...options,
  });
}

type UseInactiveCustomersQuery = {
  branchId?: string;
  limit?: number;
};

export function useInactiveCustomers(
  query: UseInactiveCustomersQuery = {},
  options?: Pick<UseQueryOptions<InactiveCustomersList>, 'enabled'>,
): ReturnType<typeof useQuery<InactiveCustomersList>> {
  return useQuery<InactiveCustomersList>({
    queryKey: dashboardKeys.inactiveCustomers(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.limit ? { limit: query.limit } : { limit: 20 }),
      };
      const { data, error } = await api.GET('/api/v1/dashboard/inactive-customers', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch inactive customers');
      return data.data;
    },
    ...options,
  });
}
