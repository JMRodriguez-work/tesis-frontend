import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useSale } from '@/api/queries/use-sales';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { SaleCancelDialog } from '@/components/sales/sale-cancel-dialog';
import { SaleStatusBadge } from '@/components/sales/sale-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDecimal } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/sales/$saleId/')({
  component: SaleDetailPage,
});

function SaleDetailPage() {
  const { saleId } = Route.useParams();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canCancel = role === 'Admin' || role === 'Manager';
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: sale, isLoading, error, refetch } = useSale(saleId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="p-6">
        <ErrorState
          error={error ?? new Error('Venta no encontrada')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const subtotal = Number(sale.subtotal);
  const total = Number(sale.total);
  const discount = Number(sale.discountPercent);
  const discountAmount = subtotal - total;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/sales" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Venta #{sale.id.slice(0, 8)}</h1>
          <SaleStatusBadge status={sale.status} />
        </div>
        {canCancel && sale.status === 'active' ? (
          <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
            <TrashIcon className="size-3.5" />
            Cancelar venta
          </Button>
        ) : null}
      </header>

      {sale.status === 'cancelled' ? (
        <Alert variant="destructive">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Venta cancelada</AlertTitle>
            <AlertDescription>
              <div className="flex flex-col gap-1">
                <span>
                  <strong>Motivo:</strong> {sale.cancellationReason ?? '—'}
                </span>
                {sale.deletedAt ? (
                  <span className="text-xs opacity-80">
                    Cancelada el {formatDate(sale.deletedAt, true)}
                  </span>
                ) : null}
              </div>
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <Alert>
          <CheckCircleIcon weight="fill" />
          <AlertDescription className="text-xs">
            Venta registrada. El stock fue descontado de los depósitos.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium">Información general</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Sucursal</dt>
            <dd>{sale.branch.name}</dd>
            <dt className="text-muted-foreground">Cliente</dt>
            <dd>
              {sale.customer ? (
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: sale.customer.id }}
                  className="text-foreground hover:underline"
                >
                  {sale.customer.fullname}
                </Link>
              ) : (
                <span className="text-muted-foreground">Consumidor final</span>
              )}
            </dd>
            <dt className="text-muted-foreground">Vendido por</dt>
            <dd>
              {sale.createdBy.name}
              <span className="ml-1 text-muted-foreground">({sale.createdBy.email})</span>
            </dd>
            <dt className="text-muted-foreground">Fecha</dt>
            <dd>{formatDate(sale.createdAt, true)}</dd>
            {sale.notes ? (
              <>
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="whitespace-pre-wrap">{sale.notes}</dd>
              </>
            ) : null}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Totales</h2>
          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono">{formatCurrency(subtotal)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Descuento ({formatDecimal(discount)}%)</dt>
                <dd className="font-mono text-red-600">−{formatCurrency(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
              <dt>Total</dt>
              <dd className="font-mono">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Items ({sale.items.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Código</th>
                <th className="p-2 font-medium">Depósito</th>
                <th className="p-2 font-medium text-right">Cantidad</th>
                <th className="p-2 font-medium text-right">Precio</th>
                <th className="p-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const lineTotal = Number(item.lineTotal);
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-2">
                      <Link
                        to="/items/$itemId"
                        params={{ itemId: item.itemId }}
                        className="font-medium text-foreground hover:underline"
                      >
                        {item.itemName}
                      </Link>
                    </td>
                    <td className="p-2 text-muted-foreground">{item.itemCode ?? '—'}</td>
                    <td className="p-2">
                      <Link
                        to="/warehouses/$warehouseId"
                        params={{ warehouseId: item.warehouseId }}
                        className="text-foreground hover:underline"
                      >
                        {item.warehouseName}
                      </Link>
                    </td>
                    <td className="p-2 text-right font-mono">{formatDecimal(item.quantity)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-right font-mono font-semibold">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <SaleCancelDialog open={cancelOpen} onOpenChange={setCancelOpen} saleId={sale.id} />
    </div>
  );
}

export { Route };
