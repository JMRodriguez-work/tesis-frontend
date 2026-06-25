import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type Customer, useCustomers } from '@/api/queries/use-customers';
import { DetectInactiveButton } from '@/components/customer-analytics/detect-inactive-button';
import { CustomerCreateDialog } from '@/components/customers/customer-create-dialog';
import { CustomerDeleteDialog } from '@/components/customers/customer-delete-dialog';
import { CustomerEditDialog } from '@/components/customers/customer-edit-dialog';
import { CustomerStatusBadge } from '@/components/customers/customer-status-badge';
import { actionsColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activos', value: 'false' },
  { label: 'Mostrar inactivos', value: 'true' },
];

const customersSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const Route = createFileRoute('/_authed/customers/')({
  validateSearch: customersSearchSchema,
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      search: debouncedSearch,
      showInactive: search.showInactive,
      branchId: adminBranchId,
    }),
    [search.page, debouncedSearch, search.showInactive, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useCustomers(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };
  const handleSearchChange = (value: string) => {
    void navigate({ to: '.', search: { ...search, search: value, page: 1 } });
  };
  const handleShowInactiveChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: { ...search, showInactive: value === 'true', page: 1 },
    });
  };

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        id: 'fullname',
        header: 'Nombre',
        accessorFn: (row: Customer) => row.fullname,
        cell: ({ row }) => (
          <Link
            to="/customers/$customerId"
            params={{ customerId: row.original.id }}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.fullname}
          </Link>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        accessorFn: (row: Customer) => row.email,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'phone',
        header: 'Teléfono',
        accessorFn: (row: Customer) => row.phone,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'branch',
        header: 'Sucursal',
        accessorFn: (row: Customer) => row.branch,
        cell: ({ row }) => row.original.branch.name,
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: Customer) => row.isActive,
        cell: ({ row }) => <CustomerStatusBadge isActive={row.original.isActive} />,
      },
      actionsColumn<Customer>('Acciones', (row) =>
        canEdit ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(row)}
              aria-label="Editar"
            >
              <PencilSimpleIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setToDelete(row)}
              aria-label="Eliminar"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        ) : null,
      ),
    ],
    [canEdit],
  );

  const emptyAction =
    canEdit && !showBranchWarning ? (
      <Button onClick={() => setCreateOpen(true)}>
        <PlusIcon className="size-4" />
        Crear cliente
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Clientes</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} clientes</p>
          ) : null}
        </div>
        {canEdit && !showBranchWarning ? (
          <div className="flex items-center gap-2">
            {role === 'Admin' || role === 'Manager' ? (
              <DetectInactiveButton branchId={adminBranchId} variant="outline" />
            ) : null}
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Nuevo cliente
            </Button>
          </div>
        ) : null}
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <AlertDescription>
            Seleccioná una sucursal activa en el selector del topbar para crear o ver clientes.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <label htmlFor="customers-search" className="text-xs font-medium">
            Buscar
          </label>
          <Input
            id="customers-search"
            placeholder="Nombre, email o teléfono…"
            value={search.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <ComboboxField
          label="Estado"
          items={STATUS_ITEMS}
          value={search.showInactive ? 'true' : 'false'}
          onValueChange={handleShowInactiveChange}
          placeholder="Solo activos"
          className="w-44"
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
        emptyTitle="Sin clientes"
        emptyDescription={
          canEdit ? 'Aún no hay clientes. Creá el primero.' : 'No hay clientes registrados.'
        }
        emptyAction={emptyAction}
      />

      <CustomerCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        branchId={adminBranchId}
      />
      <CustomerEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        customer={editing}
      />
      <CustomerDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        customer={toDelete}
      />
    </div>
  );
}

export { Route };
