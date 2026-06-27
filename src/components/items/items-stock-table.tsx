import { EyeIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { type ItemWithStockRow, useItemsWithStock } from '@/api/queries/use-items';
import type { paths } from '@/api/types';
import { actionsColumn } from '@/components/data-table/column-defs';
import { DataTable, type DataTableMeta } from '@/components/data-table/data-table';
import { ItemStatusBadge } from '@/components/items/item-status-badge';
import { ItemStockWarehousesCell } from '@/components/items/item-stock-warehouses-cell';
import { StockStatusBadge } from '@/components/stock/stock-status-badge';
import { buttonVariants } from '@/components/ui/button';
import { formatQuantity } from '@/lib/format';
import type { ListItemsWithStockQuery } from '@/lib/schemas/item';
import { cn } from '@/lib/utils';

type ItemsStockTableProps = {
  query: Partial<ListItemsWithStockQuery>;
  enabled?: boolean;
  onPageChange: (page: number) => void;
};

type ListItemsWithStockQueryApi = NonNullable<
  paths['/api/v1/items/stock']['get']['parameters']['query']
>;

function ItemsStockTable({ query, enabled = true, onPageChange }: ItemsStockTableProps) {
  const apiQuery: Partial<ListItemsWithStockQueryApi> = {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    ...(query.search ? { search: query.search } : {}),
    ...(query.status ? { status: query.status } : {}),
    showInactive: query.showInactive ?? false,
    ...(query.branchId ? { branchId: query.branchId } : {}),
  };
  const { data, isLoading, error, refetch } = useItemsWithStock(apiQuery, { enabled });

  const meta: DataTableMeta = useMemo(
    () =>
      data?.meta ?? { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 1 },
    [data?.meta, query.page, query.limit],
  );

  const columns = useMemo<ColumnDef<ItemWithStockRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Item',
        accessorFn: (row) => row,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              to="/items/$itemId"
              params={{ itemId: row.original.id }}
              className="text-sm font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {row.original.code ? <span className="font-mono">{row.original.code}</span> : null}
              {!row.original.isActive ? <ItemStatusBadge isActive={false} /> : null}
            </div>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Categoría',
        accessorFn: (row) => row.category?.name ?? null,
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? (
            <span className="text-sm">{v}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'totalQuantity',
        header: 'Stock total',
        accessorFn: (row) => Number(row.totalQuantity),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold">
              {formatQuantity(row.original.totalQuantity, row.original.unitType)}
            </span>
            <span className="text-xs text-muted-foreground">
              mín. {formatQuantity(row.original.totalMinStock, row.original.unitType)}
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => {
          const v = getValue() as 'out' | 'low' | 'ok';
          return <StockStatusBadge status={v} />;
        },
      },
      {
        id: 'warehouses',
        header: 'Depósitos',
        accessorFn: (row) => row.warehouses,
        cell: ({ row, getValue }) => (
          <ItemStockWarehousesCell
            warehouses={getValue() as ItemWithStockRow['warehouses']}
            unitType={row.original.unitType}
          />
        ),
      },
      actionsColumn<ItemWithStockRow>('Acciones', (row) => (
        <Link
          to="/items/$itemId"
          params={{ itemId: row.id }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          aria-label="Ver detalle"
        >
          <EyeIcon className="size-3.5" />
        </Link>
      )),
    ],
    [],
  );

  return (
    <DataTable
      data={data?.data ?? []}
      columns={columns}
      meta={meta}
      onPageChange={onPageChange}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      emptyTitle="Sin items con stock"
      emptyDescription="No hay items para mostrar con los filtros actuales."
    />
  );
}

export { ItemsStockTable };
