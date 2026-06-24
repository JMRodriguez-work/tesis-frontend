import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { unitKeys } from '@/lib/query-keys';

type UnitsListResponse = NonNullable<
  paths['/api/v1/units']['get']['responses']['200']['content']['application/json']
>;
export type Unit = UnitsListResponse['data'][number];

export function useUnits() {
  return useQuery({
    queryKey: unitKeys.list(),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/units');
      if (error || !data) throw error ?? new Error('Failed to fetch units');
      return data.data;
    },
    staleTime: Infinity,
  });
}
