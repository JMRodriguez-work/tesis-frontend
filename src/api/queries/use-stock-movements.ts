import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemKeys, stockKeys, stockMovementKeys } from '@/lib/query-keys';
import type {
  CreateAdjustmentInput,
  ListItemStockHistoryQuery,
  ListLowStockQuery,
  TransferStockInput,
} from '@/lib/schemas/stock-movement';

type StockMovementsListResponse = NonNullable<
  paths['/api/v1/stock-movements']['get']['responses']['200']['content']['application/json']
>;
export type StockMovementListItem = StockMovementsListResponse['data']['data'][number];
export type StockMovementType = StockMovementListItem['type'];
export type StockMovementsList = {
  data: StockMovementListItem[];
  meta: StockMovementsListResponse['data']['meta'];
};

type StockMovementDetailResponse = NonNullable<
  paths['/api/v1/stock-movements/{id}']['get']['responses']['200']['content']['application/json']
>;
export type StockMovementDetail = StockMovementDetailResponse['data'];

type ItemStockHistoryResponse = NonNullable<
  paths['/api/v1/items/{id}/stock-history']['get']['responses']['200']['content']['application/json']
>;
export type ItemStockHistoryItem = ItemStockHistoryResponse['data']['data'][number];
export type ItemStockHistoryList = {
  data: ItemStockHistoryItem[];
  meta: ItemStockHistoryResponse['data']['meta'];
};

type LowStockResponse = NonNullable<
  paths['/api/v1/stock-movements/low-stock']['get']['responses']['200']['content']['application/json']
>;
export type LowStockItem = LowStockResponse['data'][number];

type CreateAdjustmentBody = NonNullable<
  NonNullable<
    paths['/api/v1/stock-movements/adjustment']['post']['requestBody']
  >['content']['application/json']
>;
type TransferStockBody = NonNullable<
  NonNullable<
    paths['/api/v1/stock-movements/transfer']['post']['requestBody']
  >['content']['application/json']
>;

type UseStockMovementsQuery = {
  page?: number;
  limit?: number;
  type?: 'in' | 'out' | 'transfer' | 'adjustment' | null;
  itemId?: string;
  warehouseId?: string;
  branchId?: string;
};

export function useStockMovements(
  query: UseStockMovementsQuery = {},
  options?: Pick<UseQueryOptions<StockMovementsList>, 'enabled'>,
): ReturnType<typeof useQuery<StockMovementsList>> {
  return useQuery<StockMovementsList>({
    queryKey: stockMovementKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.type ? { type: query.type } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/stock-movements', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch stock movements');
      return data.data;
    },
    ...options,
  });
}

export function useStockMovement(id: string) {
  return useQuery({
    queryKey: stockMovementKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/stock-movements/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch stock movement');
      return data.data as StockMovementDetail;
    },
    enabled: id.length > 0,
  });
}

export function useItemStockHistory(
  itemId: string,
  query: Partial<ListItemStockHistoryQuery> = {},
  options?: Pick<UseQueryOptions<ItemStockHistoryList>, 'enabled'>,
): ReturnType<typeof useQuery<ItemStockHistoryList>> {
  return useQuery<ItemStockHistoryList>({
    queryKey: stockMovementKeys.itemHistory(itemId, query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/items/{id}/stock-history', {
        params: { path: { id: itemId }, query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch item stock history');
      return data.data;
    },
    enabled: itemId.length > 0,
    ...options,
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateAdjustmentInput;
      branchId: string;
    }): Promise<StockMovementDetail> => {
      const apiBody: CreateAdjustmentBody = {
        branchId,
        warehouseId: body.warehouseId,
        itemId: body.itemId,
        direction: body.direction,
        quantity: body.quantity,
        ...(body.notes ? { notes: body.notes } : {}),
      };
      const { data, error } = await api.POST('/api/v1/stock-movements/adjustment', {
        body: apiBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create adjustment');
      return data.data as StockMovementDetail;
    },
    onSuccess: (_data, { body, branchId }) => {
      qc.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(body.warehouseId, {}) });
      qc.invalidateQueries({ queryKey: itemKeys.stock(body.itemId) });
      qc.invalidateQueries({ queryKey: itemKeys.stockLists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lowStock({ branchId }) });
    },
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: TransferStockInput;
      branchId: string;
    }): Promise<StockMovementDetail> => {
      const apiBody: TransferStockBody = {
        branchId,
        itemId: body.itemId,
        fromWarehouseId: body.fromWarehouseId,
        toWarehouseId: body.toWarehouseId,
        quantity: body.quantity,
        ...(body.notes ? { notes: body.notes } : {}),
      };
      const { data, error } = await api.POST('/api/v1/stock-movements/transfer', {
        body: apiBody,
      });
      if (error || !data) throw error ?? new Error('Failed to transfer stock');
      return data.data as StockMovementDetail;
    },
    onSuccess: (_data, { body, branchId }) => {
      qc.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(body.fromWarehouseId, {}) });
      qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(body.toWarehouseId, {}) });
      qc.invalidateQueries({ queryKey: itemKeys.stock(body.itemId) });
      qc.invalidateQueries({ queryKey: itemKeys.stockLists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lowStock({ branchId }) });
    },
  });
}

export function useLowStockItems(
  query: ListLowStockQuery = {},
  options?: Pick<UseQueryOptions<LowStockItem[]>, 'enabled'>,
): ReturnType<typeof useQuery<LowStockItem[]>> {
  return useQuery<LowStockItem[]>({
    queryKey: stockMovementKeys.lowStock(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/stock-movements/low-stock', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch low stock items');
      return data.data;
    },
    ...options,
  });
}
