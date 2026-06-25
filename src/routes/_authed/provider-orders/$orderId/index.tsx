import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PackageIcon,
  TrashIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useProviderOrder } from '@/api/queries/use-provider-orders';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { ProviderOrderCancelDialog } from '@/components/provider-orders/provider-order-cancel-dialog';
import { ProviderOrderDeleteDialog } from '@/components/provider-orders/provider-order-delete-dialog';
import { ProviderOrderReceiveDialog } from '@/components/provider-orders/provider-order-receive-dialog';
import { ProviderOrderStatusBadge } from '@/components/provider-orders/provider-order-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/provider-orders/$orderId/')({
  component: ProviderOrderDetailPage,
});

function ProviderOrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';
  const canDelete = role === 'Admin';

  const { data: order, isLoading, error, refetch } = useProviderOrder(orderId);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <ErrorState
          error={error ?? new Error('Orden no encontrada')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const isPending = order.status === 'pending';

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/provider-orders"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Orden a proveedor</h1>
          <ProviderOrderStatusBadge status={order.status} />
        </div>
        {canWrite || canDelete ? (
          <div className="flex items-center gap-1">
            {isPending && canWrite ? (
              <>
                <Button onClick={() => setReceiveOpen(true)}>
                  <CheckCircleIcon className="size-3.5" weight="fill" />
                  Recibir
                </Button>
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  <XCircleIcon className="size-3.5" />
                  Cancelar
                </Button>
              </>
            ) : null}
            {isPending && canDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <TrashIcon className="size-3.5" />
                Eliminar
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {order.status === 'cancelled' ? (
        <Alert variant="destructive">
          <XCircleIcon weight="fill" />
          <div>
            <AlertTitle>Orden cancelada</AlertTitle>
            <AlertDescription>
              Esta orden fue cancelada. No se puede editar, recibir ni eliminar.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {order.status === 'received' ? (
        <Alert variant="success">
          <CheckCircleIcon weight="fill" />
          <div>
            <AlertTitle>Orden recibida</AlertTitle>
            <AlertDescription>
              La mercadería fue recibida en un depósito. El stock de los items se actualizó
              automáticamente.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Información general</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Proveedor</dt>
          <dd>
            <Link
              to="/providers/$providerId"
              params={{ providerId: order.provider.id }}
              className="text-foreground hover:underline"
            >
              {order.provider.name}
            </Link>
          </dd>
          <dt className="text-muted-foreground">Sucursal</dt>
          <dd>{order.branch.name}</dd>
          <dt className="text-muted-foreground">Creado por</dt>
          <dd>
            {order.createdBy.name}{' '}
            <span className="text-muted-foreground">({order.createdBy.email})</span>
          </dd>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>{formatDate(order.createdAt, true)}</dd>
          <dt className="text-muted-foreground">Entrega estimada</dt>
          <dd>{order.estimatedDelivery ? formatDate(order.estimatedDelivery, false) : '—'}</dd>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-mono font-medium">{formatCurrency(order.total)}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Items</h2>
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Código</th>
                <th className="p-2 font-medium text-right">Cantidad</th>
                <th className="p-2 font-medium text-right">Costo</th>
                <th className="p-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-2">
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: item.itemId }}
                      className="text-foreground hover:underline"
                    >
                      {item.itemName}
                    </Link>
                  </td>
                  <td className="p-2 text-muted-foreground">{item.itemCode ?? '—'}</td>
                  <td className="p-2 text-right font-mono">{item.quantity}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(item.cost)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
        <PackageIcon className="mr-1 inline size-3.5" />
        El historial de movimientos de stock asociados a esta orden se mostrará en{' '}
        <span className="font-mono">/stock-movements</span> cuando esté implementado (Sprint 2.3,
        HU-019).
      </section>

      <ProviderOrderReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        orderId={order.id}
        branchId={order.branchId}
      />
      <ProviderOrderCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderId={order.id}
      />
      <ProviderOrderDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        orderId={order.id}
      />
    </div>
  );
}

export { Route };
