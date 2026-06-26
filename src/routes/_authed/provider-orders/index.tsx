import { PlusIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type ProviderOrder, useProviderOrders } from '@/api/queries/use-provider-orders';
import {
  actionsColumn,
  currencyColumn,
  dateColumn,
  numberColumn,
  textColumn,
} from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ProviderOrderStatusBadge } from '@/components/provider-orders/provider-order-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Recibida', value: 'received' },
  { label: 'Cancelada', value: 'cancelled' },
];

const providerOrdersSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  status: z.enum(['pending', 'received', 'cancelled']).nullable().default(null),
  providerId: z.string().uuid().optional(),
});

const Route = createFileRoute('/_authed/provider-orders/')({
  validateSearch: providerOrdersSearchSchema,
  component: ProviderOrdersPage,
});

function ProviderOrdersPage() {
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
      status: search.status,
      providerId: search.providerId,
      branchId: adminBranchId,
    }),
    [search.page, search.status, search.providerId, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useProviderOrders(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleStatusChange = (value: string | null) => {
    const next =
      value === 'pending' || value === 'received' || value === 'cancelled' ? value : null;
    void navigate({ to: '.', search: { ...search, status: next, page: 1 } });
  };

  const columns = useMemo<ColumnDef<ProviderOrder, unknown>[]>(
    () => [
      dateColumn<ProviderOrder>('Fecha', 'createdAt', true),
      textColumn<ProviderOrder>('Sucursal', 'branchName'),
      {
        id: 'providerName',
        header: 'Proveedor',
        accessorFn: (row: ProviderOrder) => row.providerName,
        cell: ({ row }) => (
          <Link
            to="/providers/$providerId"
            params={{ providerId: row.original.providerId }}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.providerName}
          </Link>
        ),
      },
      numberColumn<ProviderOrder>('Items', 'itemCount'),
      currencyColumn<ProviderOrder>('Total', 'total'),
      dateColumn<ProviderOrder>('Entrega est.', 'estimatedDelivery', false, '—'),
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row: ProviderOrder) => row.status,
        cell: ({ row }) => <ProviderOrderStatusBadge status={row.original.status} />,
      },
      actionsColumn<ProviderOrder>('Acciones', (row) => (
        <Link
          to="/provider-orders/$orderId"
          params={{ orderId: row.id }}
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
          <h1 className="text-lg font-semibold">Órdenes a proveedores</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} órdenes</p>
          ) : null}
        </div>
        {canWrite && !showBranchWarning ? (
          <Button onClick={() => void navigate({ to: '/provider-orders/new' })}>
            <PlusIcon className="size-4" />
            Nueva orden
          </Button>
        ) : null}
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <AlertDescription>
            Seleccioná una sucursal activa en el selector del topbar para crear o ver órdenes.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Estado"
          items={STATUS_ITEMS}
          value={search.status}
          onValueChange={handleStatusChange}
          placeholder="Todos"
          className="w-44"
        />
        {search.providerId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: '.', search: { ...search, providerId: undefined } })}
          >
            Limpiar filtro de proveedor
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
        emptyTitle="Sin órdenes"
        emptyDescription={
          canWrite ? 'Aún no hay órdenes. Creá la primera.' : 'No hay órdenes registradas.'
        }
        emptyAction={
          canWrite && !showBranchWarning ? (
            <Button onClick={() => void navigate({ to: '/provider-orders/new' })}>
              <PlusIcon className="size-4" />
              Nueva orden
            </Button>
          ) : null
        }
        caption="Lista de órdenes a proveedores"
      />
    </div>
  );
}

export { Route };
