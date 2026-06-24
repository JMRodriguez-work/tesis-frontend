import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { userKeys } from '@/lib/query-keys';
import type {
  ChangeUserRoleInput,
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '@/lib/schemas/user';

type UsersListResponse = NonNullable<
  paths['/api/v1/users']['get']['responses']['200']['content']['application/json']
>;
export type User = UsersListResponse['data']['data'][number];
export type UsersList = { data: User[]; meta: UsersListResponse['data']['meta'] };

type CreateUserBody = NonNullable<
  NonNullable<paths['/api/v1/users']['post']['requestBody']>['content']['application/json']
>;
type UpdateUserBody = NonNullable<
  NonNullable<paths['/api/v1/users/{id}']['put']['requestBody']>['content']['application/json']
>;
type ChangeRoleBody = NonNullable<
  NonNullable<
    paths['/api/v1/users/{id}/role']['patch']['requestBody']
  >['content']['application/json']
>;

export function useUsers(
  query: Partial<ListUsersQuery> = {},
  options?: Pick<UseQueryOptions<UsersList>, 'enabled'>,
): ReturnType<typeof useQuery<UsersList>> {
  return useQuery<UsersList>({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/users', {
        params: { query: query as ListUsersQuery },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch users');
      return data.data;
    },
    ...options,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/users/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch user');
      return data.data;
    },
    enabled: id.length > 0,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body }: { body: CreateUserInput }): Promise<User> => {
      const cleanBody: Record<string, unknown> = {
        email: body.email,
        password: body.password,
        name: body.name,
      };
      if (body.roleId !== undefined) cleanBody.roleId = body.roleId;
      if (body.branchId !== undefined) cleanBody.branchId = body.branchId;
      if (body.isActive !== undefined) cleanBody.isActive = body.isActive;
      const { data, error } = await api.POST('/api/v1/users', {
        body: cleanBody as CreateUserBody,
      });
      if (error || !data) throw error ?? new Error('Failed to create user');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateUserInput }): Promise<User> => {
      const cleanBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) cleanBody[key] = value;
      }
      const { data, error } = await api.PUT('/api/v1/users/{id}', {
        params: { path: { id } },
        body: cleanBody as UpdateUserBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update user');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ChangeUserRoleInput }): Promise<User> => {
      const cleanBody: Record<string, unknown> = { roleId: body.roleId };
      if (body.branchId !== undefined) cleanBody.branchId = body.branchId;
      const { data, error } = await api.PATCH('/api/v1/users/{id}/role', {
        params: { path: { id } },
        body: cleanBody as ChangeRoleBody,
      });
      if (error || !data) throw error ?? new Error('Failed to change user role');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/users/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
