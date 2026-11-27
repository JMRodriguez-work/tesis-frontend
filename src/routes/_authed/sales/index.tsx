import { PlusIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type SaleListRow, useSales } from '@/api/queries/use-sales';
import {
  actionsColumn,
  currencyColumn,
  dateColumn,
  numberColumn,
  percentColumn,
  textColumn,
} from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { SaleExportMenu } from '@/components/sales/sale-export-menu';
import { SaleStatusBadge } from '@/components/sales/sale-status-badge';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  type DateRange,
  DateRangePicker,
  parseISODate,
  toISODate,
  toISODateEnd,
} from '@/components/ui/date-range-picker';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activas', value: 'false' },
  { label: 'Todas (incl. canceladas)', value: 'true' },
];

const salesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  includeCancelled: z.boolean().nullable().default(null),
  from: z.string().nullable().default(null),
  to: z.string().nullable().default(null),
});

// Mismo default que aplica el backend cuando no se manda `from`:
// las ventas del día actual (en UTC) en adelante.
function startOfTodayUtcIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

const Route = createFileRoute('/_authed/sales/')({
  validateSearch: salesSearchSchema,
  component: SalesIndexPage,
});

function SalesIndexPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canExport = role === 'Admin' || role === 'Manager';
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const listQuery = useMemo(
    () => ({
      page: search.page,
      includeCancelled: search.includeCancelled,
      branchId: adminBranchId,
      from: search.from ?? undefined,
      to: search.to ?? undefined,
    }),
    [search.page, search.includeCancelled, search.from, search.to, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useSales(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const range = useMemo<DateRange>(
    () => ({ from: parseISODate(search.from), to: parseISODate(search.to) }),
    [search.from, search.to],
  );

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleStatusChange = (value: string | null) => {
    const next = value === 'true' ? true : value === 'false' ? false : null;
    void navigate({ to: '.', search: { ...search, includeCancelled: next, page: 1 } });
  };
  const handleRangeChange = (nextRange: DateRange) => {
    void navigate({
      to: '.',
      search: {
        ...search,
        from: toISODate(nextRange.from),
        to: toISODateEnd(nextRange.to),
        page: 1,
      },
    });
  };

  const columns = useMemo<ColumnDef<SaleListRow, unknown>[]>(
    () => [
      dateColumn<SaleListRow>('Fecha', 'createdAt', true),
      textColumn<SaleListRow>('Sucursal', 'branchName'),
      {
        id: 'customerName',
        header: 'Cliente',
        accessorFn: (row: SaleListRow) => row.customerName,
        cell: ({ row }) => {
          const c = row.original;
          if (!c.customerId || !c.customerName) {
            return <span className="text-xs text-muted-foreground">Consumidor final</span>;
          }
          return (
            <Link
              to="/customers/$customerId"
              params={{ customerId: c.customerId }}
              className="font-medium text-foreground hover:underline"
            >
              {c.customerName}
            </Link>
          );
        },
      },
      numberColumn<SaleListRow>('Items', 'itemCount'),
      currencyColumn<SaleListRow>('Total', 'total'),
      percentColumn<SaleListRow>('Desc.', 'discountPercent'),
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row) => row.status,
        cell: ({ row }) => <SaleStatusBadge status={row.original.status} />,
      },
      actionsColumn<SaleListRow>('Acciones', (row) => (
        <Link
          to="/sales/$saleId"
          params={{ saleId: row.id }}
          className="text-foreground text-xs hover:underline"
        >
          Ver detalle
        </Link>
      )),
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ventas</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} ventas</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {canExport ? (
            <SaleExportMenu
              from={search.from ?? startOfTodayUtcIso()}
              to={search.to ?? undefined}
            />
          ) : null}
          {!showBranchWarning ? (
            <Button size="sm" onClick={() => void navigate({ to: '/sales/new' })}>
              <PlusIcon className="size-4" />
              Nueva venta
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Estado"
          items={STATUS_ITEMS}
          value={search.includeCancelled === true ? 'true' : 'false'}
          onValueChange={handleStatusChange}
          placeholder="Solo activas"
          className="w-56"
        />
        <DateRangePicker
          value={range}
          onChange={handleRangeChange}
          placeholder="Hoy"
          className="w-80"
        />
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Sin ventas"
        emptyDescription={
          search.from || search.to
            ? 'No hay ventas en el rango de fechas seleccionado.'
            : 'No hay ventas registradas hoy. Probá seleccionar otro rango de fechas.'
        }
        emptyAction={
          !showBranchWarning ? (
            <Button size="sm" onClick={() => void navigate({ to: '/sales/new' })}>
              <PlusIcon className="size-4" />
              Nueva venta
            </Button>
          ) : null
        }
        caption="Lista de ventas"
      />
    </div>
  );
}

export { Route };
