import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { type CustomerSegmentRow, useCustomerSegments } from '@/api/queries/use-customer-analytics';
import { DetectInactiveButton } from '@/components/customer-analytics/detect-inactive-button';
import { SEGMENT_CONFIG, SegmentBadge } from '@/components/customer-analytics/segment-badge';
import { SegmentSummaryGrid } from '@/components/customer-analytics/segment-summary-grid';
import {
  currencyColumn,
  dateColumn,
  numberColumn,
  textColumn,
} from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';
import {
  type CustomerSegment,
  listCustomerSegmentsQuerySchema,
} from '@/lib/schemas/customer-analytics';

const SEGMENT_ITEMS: ComboboxItem[] = [
  { label: 'Todos los segmentos', value: null },
  ...Object.entries(SEGMENT_CONFIG).map(([key, config]) => ({
    label: config.label,
    value: key,
  })),
];

const segmentsSearchSchema = listCustomerSegmentsQuerySchema.pick({
  page: true,
  segment: true,
});

const Route = createFileRoute('/_authed/customers/segments')({
  validateSearch: segmentsSearchSchema,
  component: CustomerSegmentsPage,
});

function CustomerSegmentsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const canDetect = role === 'Admin' || role === 'Manager';

  const apiQuery = useMemo(
    () => ({
      page: search.page,
      segment: search.segment,
      branchId: adminBranchId,
    }),
    [search.page, search.segment, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useCustomerSegments(apiQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      void navigate({ to: '.', search: { ...search, page: newPage } });
    },
    [navigate, search],
  );

  const handleSegmentChange = useCallback(
    (value: string | null) => {
      const next: CustomerSegment | null =
        value === 'vip' ||
        value === 'frequent' ||
        value === 'occasional' ||
        value === 'new' ||
        value === 'inactive' ||
        value === 'dormant'
          ? value
          : null;
      void navigate({ to: '.', search: { ...search, segment: next, page: 1 } });
    },
    [navigate, search],
  );

  const columns = useMemo<ColumnDef<CustomerSegmentRow, unknown>[]>(
    () => [
      {
        id: 'customerFullname',
        header: 'Cliente',
        accessorFn: (row) => row.customerFullname,
        cell: ({ row }) => (
          <Link
            to="/customers/$customerId"
            params={{ customerId: row.original.customerId }}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.customerFullname}
          </Link>
        ),
      },
      textColumn<CustomerSegmentRow>('Sucursal', 'branchName'),
      {
        id: 'segment',
        header: 'Segmento',
        accessorFn: (row) => row.segment,
        cell: ({ row }) => <SegmentBadge segment={row.original.segment} />,
      },
      currencyColumn<CustomerSegmentRow>('Total gastado', 'totalSpent'),
      numberColumn<CustomerSegmentRow>('Compras', 'purchaseCount'),
      dateColumn<CustomerSegmentRow>('Última compra', 'lastPurchaseAt'),
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Segmentación de clientes</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} clientes segmentados</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              VIP, frecuentes, ocasionales, nuevos, inactivos y dormidos
            </p>
          )}
        </div>
        {canDetect ? <DetectInactiveButton branchId={adminBranchId} variant="outline" /> : null}
      </header>

      <SegmentSummaryGrid customers={data?.data ?? []} />

      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Segmento"
          items={SEGMENT_ITEMS}
          value={search.segment}
          onValueChange={handleSegmentChange}
          placeholder="Todos los segmentos"
          className="w-56"
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
        emptyTitle="Sin clientes segmentados"
        emptyDescription="Asegurate de tener ventas registradas para que el back pueda segmentar a tus clientes."
        caption="Lista de clientes segmentados"
      />
    </div>
  );
}

export { Route };
