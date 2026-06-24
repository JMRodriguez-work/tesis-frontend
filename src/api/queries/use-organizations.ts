import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { organizationKeys } from '@/lib/query-keys';
import type { UpdateOrganizationInput } from '@/lib/schemas/organization';

type OrganizationResponse = NonNullable<
  paths['/api/v1/organizations/{id}']['get']['responses']['200']['content']['application/json']
>;
export type Organization = OrganizationResponse['data'];

type UpdateOrganizationBody = NonNullable<
  NonNullable<
    paths['/api/v1/organizations/{id}']['put']['requestBody']
  >['content']['application/json']
>;

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/organizations/{id}', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch organization');
      return data.data;
    },
    enabled: id.length > 0,
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateOrganizationInput;
    }): Promise<Organization> => {
      const { data, error } = await api.PUT('/api/v1/organizations/{id}', {
        params: { path: { id } },
        body: body as UpdateOrganizationBody,
      });
      if (error || !data) throw error ?? new Error('Failed to update organization');
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: organizationKeys.detail(id) });
    },
  });
}
