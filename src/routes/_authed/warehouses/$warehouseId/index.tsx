import { ArrowLeftIcon, ArrowsLeftRightIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useStockByWarehouse, type WarehouseStockRow } from '@/api/queries/use-stock';
import { type StockMovementListItem, useStockMovements } from '@/api/queries/use-stock-movements';
import { useWarehouse } from '@/api/queries/use-warehouses';
import { actionsColumn, dateColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { EditMinStockDialog } from '@/components/items/edit-min-stock-dialog';
import { StockStatusBadge } from '@/components/stock/stock-status-badge';
import { StockMovementTypeBadge } from '@/components/stock-movements/stock-movement-type-badge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate, formatQuantity } from '@/lib/format';
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
  movementPage: z.number().int().min(1).default(1),
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
  const handleMovementPageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, movementPage: newPage } });
  };

  const {
    data: movements,
    isLoading: isLoadingMovements,
    error: movementsError,
    refetch: refetchMovements,
  } = useStockMovements({ warehouseId, page: search.movementPage, limit: 20 });

  const movementColumns = useMemo<ColumnDef<StockMovementListItem, unknown>[]>(
    () => [
      dateColumn<StockMovementListItem>('Fecha', 'createdAt', true),
      {
        id: 'type',
        header: 'Tipo',
        accessorFn: (row) => row.type,
        cell: ({ row }) => <StockMovementTypeBadge type={row.original.type} />,
      },
      {
        id: 'item',
        header: 'Item',
        accessorFn: (row) => row.itemName,
        cell: ({ row }) => (
          <Link
            to="/items/$itemId"
            params={{ itemId: row.original.itemId }}
            className="text-foreground text-xs hover:underline"
          >
            {row.original.itemName}
          </Link>
        ),
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
        id: 'counterpart',
        header: 'Contraparte',
        accessorFn: (row) => row,
        cell: ({ row }) => {
          const m = row.original;
          if (m.type === 'transfer') {
            const counter =
              m.toWarehouseId === warehouseId ? m.fromWarehouseName : m.toWarehouseName;
            return (
              <span className="text-xs text-muted-foreground">
                <ArrowsLeftRightIcon className="mr-1 inline size-3" />
                {counter ?? '—'}
              </span>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      textColumn<StockMovementListItem>('Sucursal', 'branchName'),
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
    [warehouseId],
  );

  const columns = useMemo<ColumnDef<WarehouseStockRow, unknown>[]>(
    () => [
      textColumn<WarehouseStockRow>('Item', 'itemName'),
      {
        id: 'itemCode',
        header: 'Código',
        accessorFn: (row) => row.itemCode,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'quantity',
        header: 'Cantidad',
        accessorFn: (row) => Number(row.quantity),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {formatQuantity(row.original.quantity, row.original.unitType ?? null)}
          </span>
        ),
      },
      {
        id: 'minStock',
        header: 'Mínimo',
        accessorFn: (row) => Number(row.minStock),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {formatQuantity(row.original.minStock, row.original.unitType ?? null)}
          </span>
        ),
      },
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

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Historial de movimientos</h2>
          <Link
            to="/stock-movements"
            search={{ warehouseId }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <DataTable
          data={movements?.data ?? []}
          columns={movementColumns}
          meta={movements?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={handleMovementPageChange}
          isLoading={isLoadingMovements}
          error={movementsError}
          onRetry={() => void refetchMovements()}
          emptyTitle="Sin movimientos"
          emptyDescription="Este depósito no tiene movimientos de stock registrados."
          caption="Historial de movimientos del depósito"
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
