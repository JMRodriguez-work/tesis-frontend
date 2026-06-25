import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { stockKeys } from '@/lib/query-keys';

type WarehouseStockListResponse = NonNullable<
  paths['/api/v1/warehouses/{id}/stock']['get']['responses']['200']['content']['application/json']
>;
export type WarehouseStockRow = WarehouseStockListResponse['data']['data'][number];
export type StockStatus = WarehouseStockRow['status'];
export type WarehouseStockList = {
  data: WarehouseStockRow[];
  meta: WarehouseStockListResponse['data']['meta'];
};

type ListWarehouseStockQuery = NonNullable<
  paths['/api/v1/warehouses/{id}/stock']['get']['parameters']['query']
>;

export function useStockByWarehouse(
  warehouseId: string,
  query: Partial<Omit<ListWarehouseStockQuery, 'page' | 'limit'>> & {
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery<WarehouseStockList>({
    queryKey: stockKeys.byWarehouse(warehouseId, query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/warehouses/{id}/stock', {
        params: { path: { id: warehouseId }, query: query as ListWarehouseStockQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch warehouse stock');
      return data.data;
    },
    enabled: warehouseId.length > 0,
  });
}
