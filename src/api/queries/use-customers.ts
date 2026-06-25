import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { customerKeys } from '@/lib/query-keys';
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from '@/lib/schemas/customer';

type CustomersListResponse = NonNullable<
  paths['/api/v1/customers']['get']['responses']['200']['content']['application/json']
>;
export type Customer = CustomersListResponse['data']['data'][number];
export type CustomersList = {
  data: Customer[];
  meta: CustomersListResponse['data']['meta'];
};

type CreateCustomerBody = NonNullable<
  NonNullable<paths['/api/v1/customers']['post']['requestBody']>['content']['application/json']
>;
type UpdateCustomerBody = NonNullable<
  NonNullable<paths['/api/v1/customers/{id}']['put']['requestBody']>['content']['application/json']
>;

type CustomerSalesResponse = NonNullable<
  paths['/api/v1/customers/{id}/sales']['get']['responses']['200']['content']['application/json']
>;
export type CustomerSale = CustomerSalesResponse['data']['data'][number];
export type CustomerSalesSummary = CustomerSalesResponse['data']['summary'];
export type CustomerSalesList = {
  data: CustomerSale[];
  summary: CustomerSalesSummary;
  meta: CustomerSalesResponse['data']['meta'];
};

type ListCustomerSalesQuery = NonNullable<
  paths['/api/v1/customers/{id}/sales']['get']['parameters']['query']
>;

export function useCustomers(
  query: Partial<ListCustomersQuery> & { branchId?: string } = {},
  options?: Pick<UseQueryOptions<CustomersList>, 'enabled'>,
): ReturnType<typeof useQuery<CustomersList>> {
  return useQuery<CustomersList>({
    queryKey: customerKeys.list(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: 20,
        ...(query.search ? { search: query.search } : {}),
        ...(query.showInactive !== undefined ? { isActive: !query.showInactive } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/customers', {
        params: { query: apiQuery as ListCustomersQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch customers');
      return data.data;
    },
    ...options,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/customers/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch customer');
      return data.data as Customer;
    },
    enabled: id.length > 0,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateCustomerInput;
      branchId?: string;
    }): Promise<Customer> => {
      const cleanBody: Record<string, unknown> = { fullname: body.fullname };
      if (body.email) cleanBody.email = body.email;
      if (body.phone) cleanBody.phone = body.phone;
      if (body.address) cleanBody.address = body.address;
      if (branchId) cleanBody.branchId = branchId;
      const { data, error } = await api.POST('/api/v1/customers', {
        body: cleanBody as CreateCustomerBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create customer');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateCustomerInput;
    }): Promise<Customer> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/customers/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateCustomerBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update customer');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/customers/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useCustomerSales(
  id: string,
  query: Partial<Omit<ListCustomerSalesQuery, 'page' | 'limit'>> & {
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery<CustomerSalesList>({
    queryKey: [...customerKeys.detail(id), 'sales', query] as const,
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: 20,
        ...(query.includeCancelled !== undefined
          ? { includeCancelled: query.includeCancelled }
          : {}),
      };
      const { data, error } = await api.GET('/api/v1/customers/{id}/sales', {
        params: { path: { id }, query: apiQuery as ListCustomerSalesQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch customer sales');
      return data.data;
    },
    enabled: id.length > 0,
  });
}
