import { ArrowLeftIcon, PencilSimpleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useDeleteItem, useItem, useItemStock } from '@/api/queries/use-items';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { EditMinStockDialog } from '@/components/items/edit-min-stock-dialog';
import { ItemStatusBadge } from '@/components/items/item-status-badge';
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
import { formatCurrency, formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/items/$itemId/')({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role !== 'Employee';

  const { data: itemData, isLoading, error, refetch } = useItem(itemId);
  const { data: stock, isLoading: isLoadingStock } = useItemStock(itemId);
  const deleteItem = useDeleteItem();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMinStockFor, setEditMinStockFor] = useState<{
    itemId: string;
    current: string;
  } | null>(null);

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
              {stock.map((row) => (
                <tr key={row.warehouseId} className="border-b last:border-0">
                  <td className="py-2">{row.warehouseName}</td>
                  <td className="py-2">{formatCurrency(row.quantity)}</td>
                  <td className="py-2">{formatCurrency(row.minStock)}</td>
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
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-muted-foreground">Sin stock registrado en ningún depósito.</p>
        )}
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
        El historial de movimientos de stock se mostrará en{' '}
        <span className="font-mono">/stock-movements?itemId={item.id}</span> cuando esté
        implementado (Sprint 2.3).
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
