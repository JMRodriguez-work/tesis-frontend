import { ArrowLeftIcon, PencilSimpleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type CustomerSale, useCustomer, useCustomerSales } from '@/api/queries/use-customers';
import { CustomerDeleteDialog } from '@/components/customers/customer-delete-dialog';
import { CustomerEditDialog } from '@/components/customers/customer-edit-dialog';
import { CustomerStatusBadge } from '@/components/customers/customer-status-badge';
import {
  currencyColumn,
  dateColumn,
  numberColumn,
  textColumn,
} from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { formatCurrency, formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const INCLUDE_CANCELLED_ITEMS: ComboboxItem[] = [
  { label: 'No', value: 'false' },
  { label: 'Sí', value: 'true' },
];

const customerDetailSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  includeCancelled: z.boolean().default(false),
});

const Route = createFileRoute('/_authed/customers/$customerId/')({
  validateSearch: customerDetailSearchSchema,
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin' || role === 'Manager';

  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
    refetch: refetchCustomer,
  } = useCustomer(customerId);
  const [editing, setEditing] = useState(false);
  const [toDelete, setToDelete] = useState(false);

  const salesQuery = useMemo(
    () => ({ page: search.page, limit: 20, includeCancelled: search.includeCancelled }),
    [search.page, search.includeCancelled],
  );
  const {
    data: sales,
    isLoading: isLoadingSales,
    error: salesError,
    refetch: refetchSales,
  } = useCustomerSales(customerId, salesQuery);

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleIncludeCancelledChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: { ...search, includeCancelled: value === 'true', page: 1 },
    });
  };

  const salesColumns = useMemo<ColumnDef<CustomerSale, unknown>[]>(
    () => [
      dateColumn<CustomerSale>('Fecha', 'createdAt', true),
      textColumn<CustomerSale>('Sucursal', 'branchName'),
      numberColumn<CustomerSale>('Items', 'itemCount'),
      currencyColumn<CustomerSale>('Total', 'total'),
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <Badge variant={value === 'active' ? 'default' : 'secondary'}>
              {value === 'active' ? 'Activa' : 'Cancelada'}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  if (isLoadingCustomer) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="p-6">
        <ErrorState
          error={customerError ?? new Error('Cliente no encontrado')}
          onRetry={() => void refetchCustomer()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{customer.fullname}</h1>
          <CustomerStatusBadge isActive={customer.isActive} />
        </div>
        {canEdit ? (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <PencilSimpleIcon className="size-3.5" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setToDelete(true)}>
              <TrashIcon className="size-3.5" />
              Eliminar
            </Button>
          </div>
        ) : null}
      </header>

      {!customer.isActive ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Cliente inactivo</AlertTitle>
            <AlertDescription>
              Este cliente fue dado de baja. Reactiválo desde Editar para volver a usarlo.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total gastado</CardDescription>
            <CardTitle className="text-lg">{formatCurrency(sales?.summary.totalSpent)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Compras realizadas</CardDescription>
            <CardTitle className="text-lg">{sales?.summary.purchaseCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Última compra</CardDescription>
            <CardTitle className="text-base">
              {sales?.summary.lastPurchaseAt ? formatDate(sales.summary.lastPurchaseAt, true) : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Ticket promedio</CardDescription>
            <CardTitle className="text-lg">
              {formatCurrency(sales?.summary.averageTicket)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Información general</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{customer.email ?? '—'}</dd>
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd>{customer.phone ?? '—'}</dd>
          <dt className="text-muted-foreground">Dirección</dt>
          <dd>{customer.address ?? '—'}</dd>
          <dt className="text-muted-foreground">Sucursal</dt>
          <dd>{customer.branch.name}</dd>
          <dt className="text-muted-foreground">Creado</dt>
          <dd>{formatDate(customer.createdAt, true)}</dd>
          <dt className="text-muted-foreground">Actualizado</dt>
          <dd>{formatDate(customer.updatedAt, true)}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
        La segmentación del cliente (vip / frequent / occasional / new / inactive / dormant) se
        mostrará cuando esté implementada (Sprint 3.3, HU-025/026).
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-medium">Ventas</h2>
          <ComboboxField
            label="Incluir canceladas"
            items={INCLUDE_CANCELLED_ITEMS}
            value={search.includeCancelled ? 'true' : 'false'}
            onValueChange={handleIncludeCancelledChange}
            className="w-36"
          />
        </div>
        <DataTable
          data={sales?.data ?? []}
          columns={salesColumns}
          meta={sales?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={handlePageChange}
          isLoading={isLoadingSales}
          error={salesError}
          onRetry={() => void refetchSales()}
          emptyTitle="Sin ventas"
          emptyDescription="Este cliente aún no tiene ventas registradas."
        />
      </section>

      <CustomerEditDialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
        customer={customer}
      />
      <CustomerDeleteDialog
        open={toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(false);
        }}
        customer={customer}
      />
    </div>
  );
}

export { Route };
