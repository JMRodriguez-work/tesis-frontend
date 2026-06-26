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
    onMutate: async ({ id }) => {
      // Cancela refetches en flight para que no pisen el optimistic update.
      await qc.cancelQueries({ queryKey: notificationKeys.unread({}) });

      // Snapshot del cache actual para rollback en onError.
      const previous = qc.getQueryData<Notifications>(notificationKeys.unread({}));

      // Optimistic update: decrementar unreadCount y remover la recommendation de la lista.
      if (previous) {
        qc.setQueryData<Notifications>(notificationKeys.unread({}), {
          ...previous,
          unreadCount: Math.max(0, previous.unreadCount - 1),
          recommendations: previous.recommendations.filter((rec) => rec.id !== id),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback al snapshot si el mutation falló.
      if (context?.previous) {
        qc.setQueryData(notificationKeys.unread({}), context.previous);
      }
    },
    onSettled: () => {
      // Sincroniza con el back (fuente de verdad), tanto en success como en error.
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
    onMutate: async (variables) => {
      const branchId = variables?.branchId;
      await qc.cancelQueries({ queryKey: notificationKeys.unread({ branchId }) });

      const previous = qc.getQueryData<Notifications>(notificationKeys.unread({ branchId }));

      // Optimistic update: vaciar la lista y resetear el contador.
      if (previous) {
        qc.setQueryData<Notifications>(notificationKeys.unread({ branchId }), {
          ...previous,
          unreadCount: 0,
          recommendations: [],
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(notificationKeys.unread({}), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread({}) });
      qc.invalidateQueries({ queryKey: recommendationKeys.lists() });
    },
  });
}
