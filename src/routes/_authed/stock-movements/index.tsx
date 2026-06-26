import {
  ArrowLineDownIcon,
  ArrowLineUpIcon,
  ArrowsLeftRightIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useMe } from '@/api/queries/use-auth';
import {
  type StockMovementListItem,
  useLowStockItems,
  useStockMovements,
} from '@/api/queries/use-stock-movements';
import { dateColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { StockMovementTypeBadge } from '@/components/stock-movements/stock-movement-type-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';
import { listStockMovementsQuerySchema } from '@/lib/schemas/stock-movement';
import { cn } from '@/lib/utils';

const TYPE_ITEMS: ComboboxItem[] = [
  { label: 'Todos', value: null },
  { label: 'Entrada', value: 'in' },
  { label: 'Salida', value: 'out' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Ajuste', value: 'adjustment' },
];

const stockMovementsSearchSchema = listStockMovementsQuerySchema.pick({
  page: true,
  type: true,
  itemId: true,
  warehouseId: true,
});

const Route = createFileRoute('/_authed/stock-movements/')({
  validateSearch: stockMovementsSearchSchema,
  component: StockMovementsPage,
});

function StockMovementsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const listQuery = useMemo(
    () => ({
      page: search.page,
      type: search.type,
      ...(search.itemId ? { itemId: search.itemId } : {}),
      branchId: adminBranchId,
    }),
    [search.page, search.type, search.itemId, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useStockMovements(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const { data: lowStock } = useLowStockItems(
    { branchId: adminBranchId },
    { enabled: canWrite && (role !== 'Admin' || !!currentBranchId) },
  );

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleTypeChange = (value: string | null) => {
    const next =
      value === 'in' || value === 'out' || value === 'transfer' || value === 'adjustment'
        ? value
        : null;
    void navigate({ to: '.', search: { ...search, type: next, page: 1 } });
  };

  const columns = useMemo<ColumnDef<StockMovementListItem, unknown>[]>(
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
        id: 'warehouses',
        header: 'Origen → Destino',
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
          if (m.type === 'in') {
            return (
              <span className="text-xs text-muted-foreground">
                <ArrowLineDownIcon className="mr-1 inline size-3" />
                {m.toWarehouseName ?? '—'}
              </span>
            );
          }
          if (m.type === 'out') {
            return (
              <span className="text-xs text-muted-foreground">
                <ArrowLineUpIcon className="mr-1 inline size-3" />
                {m.fromWarehouseName ?? '—'}
              </span>
            );
          }
          return (
            <span className="text-xs text-muted-foreground">
              {m.fromWarehouseName ?? m.toWarehouseName ?? '—'}
            </span>
          );
        },
      },
      textColumn<StockMovementListItem>('Sucursal', 'branchName'),
      {
        id: 'referenceType',
        header: 'Origen',
        accessorFn: (row) => row.referenceType,
        cell: ({ row }) => {
          const m = row.original;
          if (!m.referenceType) return <span className="text-xs text-muted-foreground">—</span>;
          const label = formatReferenceType(m.referenceType);
          if (
            (m.referenceType === 'provider-order' || m.referenceType === 'provider_order') &&
            m.referenceId
          ) {
            return (
              <Link
                to="/provider-orders/$orderId"
                params={{ orderId: m.referenceId }}
                className="text-foreground text-xs hover:underline"
              >
                {label}
              </Link>
            );
          }
          return <span className="text-xs">{label}</span>;
        },
      },
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

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Movimientos de stock</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} movimientos</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {canWrite && lowStock && lowStock.length > 0 ? (
            <Link
              to="/stock-movements/low-stock"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-amber-300 text-amber-700 hover:bg-amber-50',
              )}
            >
              <WarningIcon className="size-4" weight="fill" />
              Stock bajo: {lowStock.length} {lowStock.length === 1 ? 'item' : 'items'}
            </Link>
          ) : null}
          {canWrite && !showBranchWarning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void navigate({ to: '/stock-movements/new-transfer' })}
              >
                <ArrowsLeftRightIcon className="size-4" />
                Nueva transferencia
              </Button>
              <Button
                size="sm"
                onClick={() => void navigate({ to: '/stock-movements/new-adjustment' })}
              >
                <PlusIcon className="size-4" />
                Nuevo ajuste
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Sucursal requerida</AlertTitle>
            <AlertDescription>
              Seleccioná una sucursal activa en el selector del topbar para crear o ver movimientos.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Tipo"
          items={TYPE_ITEMS}
          value={search.type}
          onValueChange={handleTypeChange}
          placeholder="Todos"
          className="w-48"
        />
        {search.itemId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: '.', search: { ...search, itemId: undefined } })}
          >
            Limpiar filtro de item
          </Button>
        ) : null}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Sin movimientos"
        emptyDescription={
          canWrite
            ? 'Aún no hay movimientos registrados. Creá el primer ajuste.'
            : 'No hay movimientos en esta sucursal.'
        }
        emptyAction={
          canWrite && !showBranchWarning ? (
            <Button
              size="sm"
              onClick={() => void navigate({ to: '/stock-movements/new-adjustment' })}
            >
              <PlusIcon className="size-4" />
              Nuevo ajuste
            </Button>
          ) : null
        }
        caption="Lista de movimientos de stock"
      />
    </div>
  );
}

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  sale: 'Venta',
  'provider-order': 'Orden a proveedor',
  provider_order: 'Orden a proveedor',
  manual: 'Manual',
};

function formatReferenceType(referenceType: string): string {
  const known = REFERENCE_TYPE_LABELS[referenceType];
  if (known) return known;
  const humanized = referenceType.replace(/[_-]/g, ' ').trim();
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

export { Route };
