import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemKeys, providerOrderKeys, stockKeys } from '@/lib/query-keys';
import type {
  CreateProviderOrderInput,
  ReceiveProviderOrderInput,
  UpdateProviderOrderInput,
} from '@/lib/schemas/provider-order';

type ProviderOrdersListResponse = NonNullable<
  paths['/api/v1/provider-orders']['get']['responses']['200']['content']['application/json']
>;
export type ProviderOrder = ProviderOrdersListResponse['data']['data'][number];
export type ProviderOrdersList = {
  data: ProviderOrder[];
  meta: ProviderOrdersListResponse['data']['meta'];
};

type ProviderOrderDetailResponse = NonNullable<
  paths['/api/v1/provider-orders/{id}']['get']['responses']['200']['content']['application/json']
>;
export type ProviderOrderDetail = ProviderOrderDetailResponse['data'];
export type ProviderOrderItem = ProviderOrderDetail['items'][number];
export type ProviderOrderStatus = 'pending' | 'received' | 'cancelled';

type CreateProviderOrderBody = NonNullable<
  NonNullable<
    paths['/api/v1/provider-orders']['post']['requestBody']
  >['content']['application/json']
>;
type UpdateProviderOrderBody = NonNullable<
  NonNullable<
    paths['/api/v1/provider-orders/{id}']['patch']['requestBody']
  >['content']['application/json']
>;
type ReceiveProviderOrderBody = NonNullable<
  NonNullable<
    paths['/api/v1/provider-orders/{id}/receive']['post']['requestBody']
  >['content']['application/json']
>;

type UseProviderOrdersQuery = {
  page?: number;
  limit?: number;
  status?: 'pending' | 'received' | 'cancelled' | null;
  providerId?: string;
  branchId?: string;
};

export function useProviderOrders(
  query: UseProviderOrdersQuery = {},
  options?: Pick<UseQueryOptions<ProviderOrdersList>, 'enabled'>,
): ReturnType<typeof useQuery<ProviderOrdersList>> {
  return useQuery<ProviderOrdersList>({
    queryKey: providerOrderKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: 20,
        ...(query.status ? { status: query.status } : {}),
        ...(query.providerId ? { providerId: query.providerId } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/provider-orders', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch provider orders');
      return data.data;
    },
    ...options,
  });
}

export function useProviderOrder(id: string) {
  return useQuery({
    queryKey: providerOrderKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/provider-orders/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch provider order');
      return data.data as ProviderOrderDetail;
    },
    enabled: id.length > 0,
  });
}

export function useCreateProviderOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateProviderOrderInput;
      branchId: string;
    }): Promise<ProviderOrderDetail> => {
      const cleanItems: Array<{ itemId: string; quantity: string; cost: string; unitId?: number }> =
        body.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          cost: item.cost,
          ...(item.unitId !== undefined ? { unitId: item.unitId } : {}),
        }));
      const cleanBody = {
        branchId,
        providerId: body.providerId,
        ...(body.estimatedDelivery ? { estimatedDelivery: body.estimatedDelivery } : {}),
        items: cleanItems,
      };
      const { data, error } = await api.POST('/api/v1/provider-orders', {
        body: cleanBody as CreateProviderOrderBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create provider order');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerOrderKeys.lists() });
    },
  });
}

export function useUpdateProviderOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateProviderOrderInput;
    }): Promise<ProviderOrderDetail> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PATCH('/api/v1/provider-orders/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateProviderOrderBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update provider order');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: providerOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: providerOrderKeys.detail(id) });
    },
  });
}

export function useDeleteProviderOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/provider-orders/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: providerOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: providerOrderKeys.detail(id) });
    },
  });
}

export function useCancelProviderOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.POST('/api/v1/provider-orders/{id}/cancel', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: providerOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: providerOrderKeys.detail(id) });
    },
  });
}

export function useReceiveProviderOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: ReceiveProviderOrderInput;
    }): Promise<ProviderOrderDetail> => {
      const { data, error } = await api.POST('/api/v1/provider-orders/{id}/receive', {
        params: { path: { id } },
        body: body as ReceiveProviderOrderBody,
      });
      if (error || !data) throw error ?? new Error('Failed to receive provider order');
      return data.data;
    },
    onSuccess: (data, { body }) => {
      qc.invalidateQueries({ queryKey: providerOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: providerOrderKeys.detail(data.id) });
      for (const item of data.items) {
        qc.invalidateQueries({ queryKey: itemKeys.stock(item.itemId) });
      }
      qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(body.warehouseId, {}) });
    },
  });
}
