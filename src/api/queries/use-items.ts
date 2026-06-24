import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemKeys } from '@/lib/query-keys';
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
  UpdateMinStockInput,
} from '@/lib/schemas/item';

type ItemsListResponse = NonNullable<
  paths['/api/v1/items']['get']['responses']['200']['content']['application/json']
>;
export type ItemListRow = ItemsListResponse['data']['data'][number];
export type ItemsList = { data: ItemListRow[]; meta: ItemsListResponse['data']['meta'] };

type ItemResponse = NonNullable<
  paths['/api/v1/items/{id}']['get']['responses']['200']['content']['application/json']
>;
export type Item = ItemResponse['data']['item'];
export type PricingWarning = NonNullable<ItemResponse['data']['warning']>;

type CreateItemResponse = NonNullable<
  paths['/api/v1/items']['post']['responses']['201']['content']['application/json']
>;
type CreateItemBody = NonNullable<
  NonNullable<paths['/api/v1/items']['post']['requestBody']>['content']['application/json']
>;
export type CreateItemResult = CreateItemResponse['data'];

type UpdateItemResponse = NonNullable<
  paths['/api/v1/items/{id}']['put']['responses']['200']['content']['application/json']
>;
export type UpdateItemResult = UpdateItemResponse['data'];

type ItemStockResponse = NonNullable<
  paths['/api/v1/items/{id}/stock']['get']['responses']['200']['content']['application/json']
>;
export type ItemStock = ItemStockResponse['data'][number];

type MinStockResponse = NonNullable<
  paths['/api/v1/items/{id}/min-stock']['patch']['responses']['200']['content']['application/json']
>;

type BarcodeResponse = NonNullable<
  paths['/api/v1/items/barcode/{code}']['get']['responses']['200']['content']['application/json']
>;
export type BarcodeLookupResult = BarcodeResponse['data'];

export function useItems(
  query: Partial<ListItemsQuery> = {},
  options?: Pick<UseQueryOptions<ItemsList>, 'enabled'>,
): ReturnType<typeof useQuery<ItemsList>> {
  return useQuery<ItemsList>({
    queryKey: itemKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items', {
        params: { query: query as ListItemsQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch items');
      return data.data;
    },
    ...options,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch item');
      return data.data;
    },
    enabled: id.length > 0,
  });
}

export function useLookupItemByBarcode(code: string) {
  return useQuery({
    queryKey: itemKeys.barcode(code),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items/barcode/{code}', {
        params: { path: { code } },
      });
      if (error || !data) throw error ?? new Error('Item not found');
      return data.data;
    },
    enabled: code.length > 0,
    retry: false,
  });
}

export function useItemStock(id: string) {
  return useQuery({
    queryKey: itemKeys.stock(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items/{id}/stock', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch stock');
      return data.data;
    },
    enabled: id.length > 0,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateItemInput;
      branchId?: string;
    }): Promise<CreateItemResult> => {
      const bodyWithBranch: CreateItemBody = {
        name: body.name,
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.baseUnitId !== undefined ? { baseUnitId: body.baseUnitId } : {}),
        ...(body.purchasePrice !== undefined ? { purchasePrice: body.purchasePrice } : {}),
        ...(body.salePrice !== undefined ? { salePrice: body.salePrice } : {}),
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.barcode !== undefined ? { barcode: body.barcode } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(branchId !== undefined ? { branchId } : {}),
      };
      const { data, error } = await api.POST('/api/v1/items', { body: bodyWithBranch });
      if (error || !data) throw error ?? new Error('Failed to create item');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateItemInput;
    }): Promise<UpdateItemResult> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/items/{id}', {
        params: { path: { id } },
        body: cleanBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update item');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() });
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) });
      qc.invalidateQueries({ queryKey: itemKeys.stock(id) });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/items/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateMinStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateMinStockInput }) => {
      const { data, error } = await api.PATCH('/api/v1/items/{id}/min-stock', {
        params: { path: { id } },
        body: { minStock: body.minStock },
      });
      if (error || !data) throw error ?? new Error('Failed to update min stock');
      return data.data as MinStockResponse['data'];
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: itemKeys.stock(id) });
    },
  });
}
