import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { type ProductRotationList, useProductRotation } from '@/api/queries/use-dashboard';
import { useItemCategories } from '@/api/queries/use-item-categories';
import { currencyColumn, dateColumn, numberColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';
import { listProductRotationQuerySchema } from '@/lib/schemas/dashboard';

const ZEROSALE_ITEMS: ComboboxItem[] = [
  { label: 'Con y sin ventas', value: null },
  { label: 'Solo con ventas', value: 'false' },
  { label: 'Incluir sin ventas', value: 'true' },
];

type ProductRotationTableProps = {
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  includeZeroSales?: boolean | null;
  page: number;
  onPageChange: (page: number) => void;
  onCategoryChange: (value: string | null) => void;
  onIncludeZeroSalesChange: (value: boolean | null) => void;
};

function ProductRotationTable({
  from,
  to,
  categoryId,
  includeZeroSales,
  page,
  onPageChange,
  onCategoryChange,
  onIncludeZeroSalesChange,
}: ProductRotationTableProps) {
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const { data: categories } = useItemCategories(
    { limit: 100, isActive: true, ...(adminBranchId ? { branchId: adminBranchId } : {}) },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );

  const categoryItems: ComboboxItem[] = useMemo(
    () => [
      { label: 'Todas las categorías', value: null },
      ...(categories?.data?.map((cat) => ({ label: cat.name, value: cat.id })) ?? []),
    ],
    [categories],
  );

  const apiQuery = useMemo(
    () => ({
      page,
      from,
      to,
      categoryId,
      includeZeroSales,
      branchId: adminBranchId,
    }),
    [page, from, to, categoryId, includeZeroSales, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useProductRotation(apiQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const columns = useMemo<ColumnDef<ProductRotationList['data'][number], unknown>[]>(
    () => [
      {
        id: 'itemName',
        header: 'Item',
        accessorFn: (row) => row.itemName,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <Link
              to="/items/$itemId"
              params={{ itemId: m.itemId }}
              className="font-medium text-foreground hover:underline"
            >
              {m.itemName}
              {m.itemCode ? (
                <span className="ml-1 text-[10px] text-muted-foreground">({m.itemCode})</span>
              ) : null}
            </Link>
          );
        },
      },
      {
        id: 'categoryName',
        header: 'Categoría',
        accessorFn: (row) => row.categoryName,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      numberColumn<ProductRotationList['data'][number]>('Cantidad vendida', 'totalQuantitySold'),
      currencyColumn<ProductRotationList['data'][number]>('Ingresos', 'totalRevenue'),
      numberColumn<ProductRotationList['data'][number]>('Transacciones', 'transactionCount'),
      dateColumn<ProductRotationList['data'][number]>('Última venta', 'lastSoldAt'),
    ],
    [],
  );

  const zerosaleValue = includeZeroSales === null ? null : includeZeroSales ? 'true' : 'false';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Categoría"
          items={categoryItems}
          value={categoryId ?? null}
          onValueChange={onCategoryChange}
          placeholder="Todas las categorías"
          className="w-56"
        />
        <ComboboxField
          label="Items sin ventas"
          items={ZEROSALE_ITEMS}
          value={zerosaleValue}
          onValueChange={(v) => {
            if (v === 'true') onIncludeZeroSalesChange(true);
            else if (v === 'false') onIncludeZeroSalesChange(false);
            else onIncludeZeroSalesChange(null);
          }}
          placeholder="Con y sin ventas"
          className="w-48"
        />
        {from || to ? (
          <p className="text-xs text-muted-foreground">
            Período: {from ?? '—'} → {to ?? '—'}
          </p>
        ) : null}
      </div>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
        onPageChange={onPageChange}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Sin datos de rotación"
        emptyDescription="No hay items vendidos en el período seleccionado."
        caption="Rotación de productos"
      />
    </div>
  );
}

export { listProductRotationQuerySchema, ProductRotationTable };
