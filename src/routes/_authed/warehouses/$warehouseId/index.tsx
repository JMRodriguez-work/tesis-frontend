import { ArrowLeftIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useStockByWarehouse, type WarehouseStockRow } from '@/api/queries/use-stock';
import { useWarehouse } from '@/api/queries/use-warehouses';
import { actionsColumn, currencyColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { EditMinStockDialog } from '@/components/items/edit-min-stock-dialog';
import { StockStatusBadge } from '@/components/stock/stock-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Todos', value: null },
  { label: 'OK', value: 'ok' },
  { label: 'Bajo', value: 'low' },
  { label: 'Sin stock', value: 'out' },
];

const warehouseDetailSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  status: z.enum(['ok', 'low', 'out']).nullable().default(null),
});

const Route = createFileRoute('/_authed/warehouses/$warehouseId/')({
  validateSearch: warehouseDetailSearchSchema,
  component: WarehouseDetailPage,
});

function WarehouseDetailPage() {
  const { warehouseId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);

  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role !== 'Employee';

  const {
    data: warehouse,
    isLoading: isLoadingWarehouse,
    error: warehouseError,
    refetch: refetchWarehouse,
  } = useWarehouse(warehouseId);

  const [editingMinStock, setEditingMinStock] = useState<{
    itemId: string;
    current: string;
  } | null>(null);

  const stockQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.status ? { status: search.status } : {}),
    }),
    [search.page, debouncedSearch, search.status],
  );
  const {
    data: stock,
    isLoading: isLoadingStock,
    error: stockError,
    refetch: refetchStock,
  } = useStockByWarehouse(warehouseId, stockQuery);

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleSearchChange = (value: string) => {
    void navigate({ to: '.', search: { ...search, search: value, page: 1 } });
  };
  const handleStatusChange = (value: string | null) => {
    const next = value === 'ok' || value === 'low' || value === 'out' ? value : null;
    void navigate({ to: '.', search: { ...search, status: next, page: 1 } });
  };

  const columns = useMemo<ColumnDef<WarehouseStockRow, unknown>[]>(
    () => [
      textColumn<WarehouseStockRow>('Item', 'itemName'),
      {
        id: 'itemCode',
        header: 'Código',
        accessorFn: (row) => row.itemCode,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      currencyColumn<WarehouseStockRow>('Cantidad', 'quantity'),
      currencyColumn<WarehouseStockRow>('Mínimo', 'minStock'),
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row) => row.status,
        cell: ({ row }) => <StockStatusBadge status={row.original.status} />,
      },
      actionsColumn<WarehouseStockRow>('Acciones', (row) =>
        canEdit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingMinStock({ itemId: row.itemId, current: row.minStock })}
          >
            <PencilSimpleIcon className="size-3.5" />
            Editar mín.
          </Button>
        ) : null,
      ),
    ],
    [canEdit],
  );

  if (isLoadingWarehouse) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (warehouseError || !warehouse) {
    return (
      <div className="p-6">
        <ErrorState
          error={warehouseError ?? new Error('Depósito no encontrado')}
          onRetry={() => void refetchWarehouse()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/warehouses"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{warehouse.name}</h1>
          <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
            {warehouse.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Información general</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Descripción</dt>
          <dd>{warehouse.description ?? '—'}</dd>
          <dt className="text-muted-foreground">Organización</dt>
          <dd>{warehouse.organization.name}</dd>
          <dt className="text-muted-foreground">Sucursales</dt>
          <dd>
            {warehouse.branches.length > 0 ? warehouse.branches.map((b) => b.name).join(', ') : '—'}
          </dd>
          <dt className="text-muted-foreground">Creado</dt>
          <dd>{formatDate(warehouse.createdAt, true)}</dd>
          <dt className="text-muted-foreground">Actualizado</dt>
          <dd>{formatDate(warehouse.updatedAt, true)}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Stock</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <label htmlFor="stock-search" className="text-xs font-medium">
              Buscar
            </label>
            <Input
              id="stock-search"
              placeholder="Nombre del item…"
              value={search.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <ComboboxField
            label="Estado"
            items={STATUS_ITEMS}
            value={search.status}
            onValueChange={handleStatusChange}
            placeholder="Todos"
            className="w-44"
          />
        </div>
        <DataTable
          data={stock?.data ?? []}
          columns={columns}
          meta={stock?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={handlePageChange}
          isLoading={isLoadingStock}
          error={stockError}
          onRetry={() => void refetchStock()}
          emptyTitle="Sin stock"
          emptyDescription="Este depósito no tiene items con stock registrado."
        />
      </section>

      {editingMinStock ? (
        <EditMinStockDialog
          itemId={editingMinStock.itemId}
          current={editingMinStock.current}
          onClose={() => setEditingMinStock(null)}
          onSaved={() => {
            setEditingMinStock(null);
            void refetchStock();
          }}
        />
      ) : null}
    </div>
  );
}

export { Route };
