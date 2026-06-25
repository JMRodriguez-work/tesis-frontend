import {
  ArrowLeftIcon,
  ArrowsLeftRightIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useDeleteItem, useItem, useItemStock } from '@/api/queries/use-items';
import { type ItemStockHistoryItem, useItemStockHistory } from '@/api/queries/use-stock-movements';
import { dateColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { EditMinStockDialog } from '@/components/items/edit-min-stock-dialog';
import { ItemStatusBadge } from '@/components/items/item-status-badge';
import { StockMovementTypeBadge } from '@/components/stock-movements/stock-movement-type-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';
import { formatCurrency, formatDate, formatDecimal } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const itemDetailSearchSchema = z.object({
  historyPage: z.number().int().min(1).default(1),
});

const Route = createFileRoute('/_authed/items/$itemId/')({
  validateSearch: itemDetailSearchSchema,
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role !== 'Employee';

  const { data: itemData, isLoading, error, refetch } = useItem(itemId);
  const { data: stock, isLoading: isLoadingStock } = useItemStock(itemId);
  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useItemStockHistory(itemId, { page: search.historyPage });
  const deleteItem = useDeleteItem();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMinStockFor, setEditMinStockFor] = useState<{
    itemId: string;
    current: string;
  } | null>(null);

  const handleHistoryPageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, historyPage: newPage } });
  };

  const historyColumns = useMemo<ColumnDef<ItemStockHistoryItem, unknown>[]>(
    () => [
      dateColumn<ItemStockHistoryItem>('Fecha', 'createdAt', true),
      {
        id: 'type',
        header: 'Tipo',
        accessorFn: (row) => row.type,
        cell: ({ row }) => <StockMovementTypeBadge type={row.original.type} />,
      },
      {
        id: 'warehouses',
        header: 'Depósito',
        accessorFn: (row) => row,
        cell: ({ row }) => {
          const m = row.original;
          if (m.type === 'transfer') {
            return (
              <span className="text-xs text-muted-foreground">
                {m.fromWarehouseName ?? '—'}
                <ArrowsLeftRightIcon className="mx-1 inline size-3" />
                {m.toWarehouseName ?? '—'}
              </span>
            );
          }
          const name = m.toWarehouseName ?? m.fromWarehouseName ?? '—';
          return <span className="text-xs text-muted-foreground">{name}</span>;
        },
      },
      {
        id: 'quantity',
        header: 'Cantidad',
        accessorFn: (row) => row.quantity,
        cell: ({ row }) => {
          const q = Number(row.original.quantity);
          const sign = row.original.type === 'in' ? '+' : row.original.type === 'out' ? '-' : '±';
          const color =
            row.original.type === 'in'
              ? 'text-emerald-600'
              : row.original.type === 'out'
                ? 'text-red-600'
                : 'text-muted-foreground';
          return (
            <span className={cn('font-mono', color)}>
              {sign}
              {Number.isNaN(q) ? row.original.quantity : q.toString()}
            </span>
          );
        },
      },
      {
        id: 'runningBalance',
        header: 'Saldo',
        accessorFn: (row) => row.runningBalance,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{formatDecimal(getValue() as string | null)}</span>
        ),
      },
      textColumn<ItemStockHistoryItem>('Sucursal', 'branchName'),
      {
        id: 'notes',
        header: 'Notas',
        accessorFn: (row) => row.notes,
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground" title={String(v)}>
              {String(v)}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !itemData) {
    return (
      <div className="p-6">
        <ErrorState
          error={error ?? new Error('Item no encontrado')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const item = itemData.item;

  const handleDelete = () => {
    deleteItem.mutate(item.id, {
      onSuccess: () => {
        toast.success('Item eliminado');
        void navigate({ to: '/items' });
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/items" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{item.name}</h1>
          <ItemStatusBadge isActive={item.isActive} />
        </div>
        {canEdit ? (
          <div className="flex items-center gap-1">
            <Link
              to="/items/$itemId/edit"
              params={{ itemId: item.id }}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <PencilSimpleIcon className="size-3.5" />
              Editar
            </Link>
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <TrashIcon className="size-3.5" />
              Eliminar
            </Button>
          </div>
        ) : null}
      </header>

      {!item.isActive ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Item inactivo</AlertTitle>
            <AlertDescription>
              Este item fue dado de baja. Reactiválo desde Editar para volver a usarlo.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Información general</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Descripción</dt>
          <dd>{item.description ?? '—'}</dd>
          <dt className="text-muted-foreground">Código</dt>
          <dd>{item.code ?? '—'}</dd>
          <dt className="text-muted-foreground">Barcode</dt>
          <dd>{item.barcode ?? '—'}</dd>
          <dt className="text-muted-foreground">Categoría</dt>
          <dd>{item.category?.name ?? '—'}</dd>
          <dt className="text-muted-foreground">Unidad base</dt>
          <dd>{item.baseUnit ? `${item.baseUnit.name} (${item.baseUnit.abbreviation})` : '—'}</dd>
          <dt className="text-muted-foreground">Precio de compra</dt>
          <dd>{formatCurrency(item.purchasePrice)}</dd>
          <dt className="text-muted-foreground">Precio de venta</dt>
          <dd>{formatCurrency(item.salePrice)}</dd>
          <dt className="text-muted-foreground">Sucursal</dt>
          <dd>{item.branch.name}</dd>
          <dt className="text-muted-foreground">Creado</dt>
          <dd>{formatDate(item.createdAt, true)}</dd>
          <dt className="text-muted-foreground">Actualizado</dt>
          <dd>{formatDate(item.updatedAt, true)}</dd>
        </dl>
        {itemData.warning ? (
          <div className="mt-4">
            <Alert variant="warning">
              <WarningIcon weight="fill" />
              <AlertDescription>{itemData.warning.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Stock por depósito</h2>
        {isLoadingStock ? (
          <Skeleton className="h-20 w-full" />
        ) : stock && stock.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Depósito</th>
                <th className="py-2 font-medium">Cantidad</th>
                <th className="py-2 font-medium">Mínimo</th>
                <th className="py-2 font-medium">Estado</th>
                {canEdit ? <th className="py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {stock.map((row) => {
                const unitAbbr = item.baseUnit?.abbreviation;
                return (
                  <tr key={row.warehouseId} className="border-b last:border-0">
                    <td className="py-2">{row.warehouseName}</td>
                    <td className="py-2">
                      {formatDecimal(row.quantity)}
                      {unitAbbr ? (
                        <span className="ml-1 text-muted-foreground">{unitAbbr}</span>
                      ) : null}
                    </td>
                    <td className="py-2">
                      {formatDecimal(row.minStock)}
                      {unitAbbr ? (
                        <span className="ml-1 text-muted-foreground">{unitAbbr}</span>
                      ) : null}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant={
                          row.status === 'out'
                            ? 'destructive'
                            : row.status === 'low'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {row.status === 'out' ? 'Sin stock' : row.status === 'low' ? 'Bajo' : 'OK'}
                      </Badge>
                    </td>
                    {canEdit ? (
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditMinStockFor({ itemId: item.id, current: row.minStock })
                          }
                        >
                          Editar mín.
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-muted-foreground">Sin stock registrado en ningún depósito.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Historial de movimientos</h2>
          <Link
            to="/stock-movements"
            search={{ itemId: item.id }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <DataTable
          data={history?.data ?? []}
          columns={historyColumns}
          meta={history?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={handleHistoryPageChange}
          isLoading={isLoadingHistory}
          error={historyError}
          onRetry={() => void refetchHistory()}
          emptyTitle="Sin movimientos"
          emptyDescription="Este item aún no tiene movimientos de stock registrados."
          caption="Historial de movimientos del item"
        />
      </section>

      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar item</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            ¿Eliminar <strong>{item.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
              {deleteItem.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editMinStockFor ? (
        <EditMinStockDialog
          itemId={editMinStockFor.itemId}
          current={editMinStockFor.current}
          onClose={() => setEditMinStockFor(null)}
          onSaved={() => setEditMinStockFor(null)}
        />
      ) : null}
    </div>
  );
}

export { Route };
