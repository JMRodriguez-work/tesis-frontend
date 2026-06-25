import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  PackageIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import {
  useMarkAllRecommendationsRead,
  useMarkRecommendationRead,
  useNotifications,
} from '@/api/queries/use-notifications';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const { data, isLoading, error } = useNotifications({
    ...(adminBranchId ? { branchId: adminBranchId } : {}),
  });
  const markRead = useMarkRecommendationRead();
  const markAllRead = useMarkAllRecommendationsRead();

  const handleRecommendationClick = useCallback(
    (id: string) => {
      markRead.mutate(
        { id },
        {
          onError: (err) => toast.error(mapApiError(err).message),
        },
      );
      setOpen(false);
      void navigate({
        to: '/recommendations',
        search: { status: 'pending', openId: id },
      });
    },
    [markRead, navigate],
  );

  const handleMarkAll = useCallback(() => {
    markAllRead.mutate(adminBranchId ? { branchId: adminBranchId } : {}, {
      onError: (err) => toast.error(mapApiError(err).message),
    });
  }, [markAllRead, adminBranchId]);

  const unreadCount = data?.unreadCount ?? 0;
  const recommendations = data?.recommendations ?? [];
  const lowStock = data?.lowStock ?? [];
  const isRecommendationsActive = routerState.location.pathname.startsWith('/recommendations');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
            aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
          >
            <BellIcon className="size-4" weight={unreadCount > 0 ? 'fill' : 'regular'} />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-medium">Notificaciones</h3>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
              className="h-7 text-xs"
            >
              <CheckIcon className="size-3" />
              Marcar todas leídas
            </Button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          <Section
            title="Recomendaciones"
            icon={<PackageIcon className="size-3" weight="bold" />}
            isLoading={isLoading}
            error={!!error}
            empty={!isLoading && !error && recommendations.length === 0}
            emptyText="No hay recomendaciones pendientes."
          >
            {recommendations.slice(0, 5).map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleRecommendationClick(rec.id)}
                className="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold capitalize text-foreground">
                    {labelForType(rec.type)}
                  </span>
                  <PriorityDot priority={rec.priority} />
                </div>
                <p className="line-clamp-2 text-muted-foreground">{rec.description}</p>
                {rec.itemName ? (
                  <p className="text-[10px] text-muted-foreground">Item: {rec.itemName}</p>
                ) : null}
              </button>
            ))}
          </Section>

          <Section
            title="Stock bajo"
            icon={<WarningIcon className="size-3" weight="bold" />}
            isLoading={isLoading}
            error={!!error}
            empty={!isLoading && !error && lowStock.length === 0}
            emptyText="No hay items bajo mínimo."
          >
            {lowStock.slice(0, 5).map((item) => (
              <Link
                key={`${item.itemId}-${item.warehouseId}`}
                to="/stock-movements/low-stock"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-xs transition-colors hover:bg-muted"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{item.itemName}</span>
                  <span className="text-[10px] text-muted-foreground">{item.warehouseName}</span>
                </div>
                <span className="font-mono text-destructive">
                  {item.status === 'out' ? 'Sin stock' : 'Bajo'}
                </span>
              </Link>
            ))}
          </Section>
        </div>

        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Link
            to="/recommendations"
            onClick={() => setOpen(false)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-7 text-xs',
              isRecommendationsActive && 'bg-muted',
            )}
          >
            Ver todas las recomendaciones
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({
  title,
  icon,
  isLoading,
  error,
  empty,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isLoading: boolean;
  error: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-2 last:border-b-0">
      <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <p className="px-2 py-2 text-xs text-destructive">Error al cargar.</p>
      ) : empty ? (
        <p className="px-2 py-2 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </div>
  );
}

function PriorityDot({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const color =
    priority === 'high'
      ? 'bg-destructive'
      : priority === 'medium'
        ? 'bg-amber-500'
        : 'bg-slate-400';
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', color)} aria-hidden />;
}

function labelForType(type: string): string {
  const map: Record<string, string> = {
    restock: 'Restock',
    pricing: 'Precio',
    trend: 'Tendencia',
    seasonal: 'Estacional',
    retention: 'Retención',
  };
  return map[type] ?? type;
}

export { NotificationsBell };
