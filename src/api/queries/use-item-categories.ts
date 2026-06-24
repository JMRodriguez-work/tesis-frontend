import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemCategoryKeys } from '@/lib/query-keys';

type CategoriesListResponse = NonNullable<
  paths['/api/v1/item-categories']['get']['responses']['200']['content']['application/json']
>;
export type ItemCategory = CategoriesListResponse['data']['data'][number];

type ListCategoriesQuery = {
  branchId?: string;
  isActive?: boolean | null;
  search?: string;
};

export function useItemCategories(query: ListCategoriesQuery = {}) {
  return useQuery({
    queryKey: itemCategoryKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/item-categories', {
        params: { query: { limit: 100, ...query } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch categories');
      return data.data.data;
    },
  });
}
