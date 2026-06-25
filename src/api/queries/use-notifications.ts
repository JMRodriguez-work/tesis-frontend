import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { notificationKeys, recommendationKeys } from '@/lib/query-keys';

type NotificationsResponse = NonNullable<
  paths['/api/v1/notifications']['get']['responses']['200']['content']['application/json']
>;
export type Notifications = NotificationsResponse['data'];
export type NotificationRecommendation = NotificationsResponse['data']['recommendations'][number];
export type NotificationLowStock = NotificationsResponse['data']['lowStock'][number];

type UseNotificationsQuery = {
  branchId?: string;
};

export function useNotifications(query: UseNotificationsQuery = {}) {
  return useQuery<Notifications>({
    queryKey: notificationKeys.unread(query),
    queryFn: async () => {
      const apiQuery: Record<string, unknown> = {
        ...(query.branchId ? { branchId: query.branchId } : {}),
      };
      const { data, error } = await api.GET('/api/v1/notifications', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to fetch notifications');
      return data.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkRecommendationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await api.PATCH('/api/v1/notifications/recommendations/{id}/read', {
        params: { path: { id } },
      });
      if (error || !data) throw error ?? new Error('Failed to mark recommendation as read');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread({}) });
      qc.invalidateQueries({ queryKey: recommendationKeys.lists() });
    },
  });
}

export function useMarkAllRecommendationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId }: { branchId?: string } = {}) => {
      const apiQuery: Record<string, unknown> = {
        ...(branchId ? { branchId } : {}),
      };
      const { data, error } = await api.PATCH('/api/v1/notifications/recommendations/read-all', {
        params: { query: apiQuery as never },
      });
      if (error || !data) throw error ?? new Error('Failed to mark all as read');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread({}) });
      qc.invalidateQueries({ queryKey: recommendationKeys.lists() });
    },
  });
}
