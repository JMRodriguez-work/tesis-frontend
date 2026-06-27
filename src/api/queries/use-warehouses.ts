import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemKeys, stockKeys, warehouseKeys } from '@/lib/query-keys';
import type {
  AssignBranchInput,
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from '@/lib/schemas/warehouse';

type WarehousesListResponse = NonNullable<
  paths['/api/v1/warehouses']['get']['responses']['200']['content']['application/json']
>;
type WarehouseDetailResponse = NonNullable<
  paths['/api/v1/warehouses/{id}']['get']['responses']['200']['content']['application/json']
>;
type Warehouse = WarehousesListResponse['data']['data'][number];
export type WarehousesList = { data: Warehouse[]; meta: WarehousesListResponse['data']['meta'] };

export function useWarehouses(query: Partial<ListWarehousesQuery> = {}) {
  return useQuery<WarehousesList>({
    queryKey: warehouseKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/warehouses', {
        params: { query: query as ListWarehousesQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch warehouses');
      return data.data;
    },
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/warehouses/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch warehouse');
      return data.data as WarehouseDetailResponse['data'];
    },
    enabled: id.length > 0,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateWarehouseInput) => {
      const { data, error } = await api.POST('/api/v1/warehouses', { body });
      if (error || !data) throw error ?? new Error('Failed to create warehouse');
      return data.data as Warehouse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateWarehouseInput;
    }): Promise<Warehouse> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/warehouses/{id}', {
        params: { path: { id } },
        body: cleanBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update warehouse');
      return data.data as Warehouse;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.lists() });
      qc.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/warehouses/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}

export function useAssignWarehouseToBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: AssignBranchInput;
    }): Promise<Warehouse> => {
      const { data, error } = await api.POST('/api/v1/warehouses/{id}/branches', {
        params: { path: { id } },
        body,
      });
      if (error || !data) throw error ?? new Error('Failed to assign warehouse to branch');
      return data.data as Warehouse;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.lists() });
      qc.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export function useUnassignWarehouseFromBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }): Promise<Warehouse> => {
      const { data, error } = await api.DELETE('/api/v1/warehouses/{id}/branches/{branchId}', {
        params: { path: { id, branchId } },
      });
      if (error || !data) throw error ?? new Error('Failed to unassign warehouse from branch');
      return data.data as Warehouse;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.lists() });
      qc.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export type UpsertStockInput = {
  itemId: string;
  quantity: string;
  minStock?: string;
};

type UpsertStockResponse = NonNullable<
  paths['/api/v1/warehouses/{id}/stock']['post']['responses']['200']['content']['application/json']
>;

export function useUpsertStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      warehouseId,
      body,
    }: {
      warehouseId: string;
      body: UpsertStockInput;
    }): Promise<UpsertStockResponse['data']> => {
      const apiBody = {
        itemId: body.itemId,
        quantity: body.quantity,
        ...(body.minStock !== undefined ? { minStock: body.minStock } : {}),
      } as UpsertStockInput;
      const { data, error } = await api.POST('/api/v1/warehouses/{id}/stock', {
        params: { path: { id: warehouseId } },
        body: apiBody,
      });
      if (error || !data) throw error ?? new Error('Failed to upsert stock');
      return data.data;
    },
    onSuccess: (_data, { warehouseId, body }) => {
      qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(warehouseId, {}) });
      qc.invalidateQueries({ queryKey: itemKeys.stock(body.itemId) });
      qc.invalidateQueries({ queryKey: itemKeys.stockLists() });
    },
  });
}

export type { Warehouse };
