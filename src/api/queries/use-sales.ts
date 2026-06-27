import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/api/client';
import type { paths } from '@/api/types';
import { customerKeys, itemKeys, saleKeys, stockKeys, stockMovementKeys } from '@/lib/query-keys';
import type { CancelSaleInput, CreateSaleInput } from '@/lib/schemas/sale';

type SalesListResponse = NonNullable<
  paths['/api/v1/sales']['get']['responses']['200']['content']['application/json']
>;
export type SaleListRow = SalesListResponse['data']['data'][number];
export type SalesList = {
  data: SaleListRow[];
  meta: SalesListResponse['data']['meta'];
};

type SaleDetailResponse = NonNullable<
  paths['/api/v1/sales/{id}']['get']['responses']['200']['content']['application/json']
>;
export type SaleDetail = SaleDetailResponse['data'];
export type SaleItem = SaleDetail['items'][number];
export type SaleStatus = SaleDetail['status'];

type CreateSaleBody = NonNullable<
  NonNullable<paths['/api/v1/sales']['post']['requestBody']>['content']['application/json']
>;
type CancelSaleBody = NonNullable<
  NonNullable<paths['/api/v1/sales/{id}']['delete']['requestBody']>['content']['application/json']
>;

type UseSalesQuery = {
  page?: number;
  limit?: number;
  includeCancelled?: boolean | null;
  customerId?: string;
  from?: string;
  to?: string;
  branchId?: string;
};

export function useSales(
  query: UseSalesQuery = {},
  options?: Pick<UseQueryOptions<SalesList>, 'enabled'>,
): ReturnType<typeof useQuery<SalesList>> {
  return useQuery<SalesList>({
    queryKey: saleKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.includeCancelled ? { includeCancelled: query.includeCancelled } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/sales', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch sales');
      return data.data;
    },
    ...options,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/sales/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch sale');
      return data.data as SaleDetail;
    },
    enabled: id.length > 0,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateSaleInput;
      branchId?: string;
    }): Promise<SaleDetail> => {
      const cleanItems: Array<{
        itemId: string;
        warehouseId: string;
        quantity: string;
        price: string;
        unitId?: number;
      }> = body.items.map((item) => ({
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        price: item.price,
        ...(item.unitId !== undefined ? { unitId: item.unitId } : {}),
      }));
      const apiBody: CreateSaleBody = {
        items: cleanItems,
        ...(body.customerId ? { customerId: body.customerId } : {}),
        ...(body.discountPercent ? { discountPercent: body.discountPercent } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
        ...(branchId ? { branchId } : {}),
      };
      const { data, error } = await api.POST('/api/v1/sales', { body: apiBody });
      if (error || !data) throw error ?? new Error('Failed to create sale');
      return data.data as SaleDetail;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: saleKeys.lists() });
      for (const item of data.items) {
        qc.invalidateQueries({ queryKey: itemKeys.stock(item.itemId) });
        qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(item.warehouseId, {}) });
      }
      qc.invalidateQueries({ queryKey: itemKeys.stockLists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lowStock({ branchId: data.branchId }) });
      if (data.customer?.id) {
        qc.invalidateQueries({ queryKey: customerKeys.detail(data.customer.id) });
      }
    },
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: CancelSaleInput;
    }): Promise<SaleDetail> => {
      const apiBody: CancelSaleBody = { cancellationReason: body.cancellationReason };
      const { data, error } = await api.DELETE('/api/v1/sales/{id}', {
        params: { path: { id } },
        body: apiBody,
      });
      if (error || !data) throw error ?? new Error('Failed to cancel sale');
      return data.data.sale as SaleDetail;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: saleKeys.lists() });
      qc.invalidateQueries({ queryKey: saleKeys.detail(data.id) });
      for (const item of data.items) {
        qc.invalidateQueries({ queryKey: itemKeys.stock(item.itemId) });
        qc.invalidateQueries({ queryKey: stockKeys.byWarehouse(item.warehouseId, {}) });
      }
      qc.invalidateQueries({ queryKey: itemKeys.stockLists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lists() });
      qc.invalidateQueries({ queryKey: stockMovementKeys.lowStock({ branchId: data.branchId }) });
      if (data.customer?.id) {
        qc.invalidateQueries({ queryKey: customerKeys.detail(data.customer.id) });
      }
    },
  });
}

type ExportSalesInput = {
  format: 'csv' | 'json';
  branchId?: string;
  from?: string;
  to?: string;
};

export function useExportSales() {
  return useMutation({
    mutationFn: async ({ format, branchId, from, to }: ExportSalesInput) => {
      const params = new URLSearchParams({ format });
      if (branchId) params.set('branchId', branchId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const url = `${BASE_URL}/api/v1/sales/export?${params.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          throw parsed;
        } catch {
          throw new Error(text || 'Error al exportar');
        }
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `ventas-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    },
  });
}
