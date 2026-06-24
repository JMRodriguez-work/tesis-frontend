import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { itemCategoryKeys } from '@/lib/query-keys';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/schemas/category';

type CategoriesListResponse = NonNullable<
  paths['/api/v1/item-categories']['get']['responses']['200']['content']['application/json']
>;
export type ItemCategory = CategoriesListResponse['data']['data'][number];
export type Category = ItemCategory;
export type CategoriesList = { data: Category[]; meta: CategoriesListResponse['data']['meta'] };

type CategoryDetailResponse = NonNullable<
  paths['/api/v1/item-categories/{id}']['get']['responses']['200']['content']['application/json']
>;

type CreateCategoryBody = NonNullable<
  NonNullable<
    paths['/api/v1/item-categories']['post']['requestBody']
  >['content']['application/json']
>;
type UpdateCategoryBody = NonNullable<
  NonNullable<
    paths['/api/v1/item-categories/{id}']['put']['requestBody']
  >['content']['application/json']
>;

type ListCategoriesQuery = {
  branchId?: string;
  isActive?: boolean | null;
  search?: string;
  page?: number;
  limit?: number;
};

export function useItemCategories(
  query: ListCategoriesQuery = {},
  options?: Pick<UseQueryOptions<CategoriesList>, 'enabled'>,
): ReturnType<typeof useQuery<CategoriesList>> {
  return useQuery<CategoriesList>({
    queryKey: itemCategoryKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/item-categories', {
        params: { query: { limit: 100, ...query } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch categories');
      return data.data;
    },
    ...options,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: itemCategoryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/item-categories/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch category');
      return data.data;
    },
    enabled: id.length > 0,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      branchId,
    }: {
      body: CreateCategoryInput;
      branchId?: string;
    }): Promise<Category> => {
      const bodyWithBranch: CreateCategoryBody = {
        name: body.name,
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(branchId !== undefined ? { branchId } : {}),
      };
      const { data, error } = await api.POST('/api/v1/item-categories', {
        body: bodyWithBranch,
      });
      if (error || !data) throw error ?? new Error('Failed to create category');
      return data.data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemCategoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateCategoryInput;
    }): Promise<Category> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/item-categories/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateCategoryBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update category');
      return data.data as Category;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: itemCategoryKeys.lists() });
      qc.invalidateQueries({ queryKey: itemCategoryKeys.detail(id) });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/item-categories/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemCategoryKeys.lists() });
    },
  });
}

export type { CategoryDetailResponse };
