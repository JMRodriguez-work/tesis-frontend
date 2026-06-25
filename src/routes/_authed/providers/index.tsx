import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type Provider, useProviders } from '@/api/queries/use-providers';
import { actionsColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ProviderCreateDialog } from '@/components/providers/provider-create-dialog';
import { ProviderDeleteDialog } from '@/components/providers/provider-delete-dialog';
import { ProviderEditDialog } from '@/components/providers/provider-edit-dialog';
import { ProviderStatusBadge } from '@/components/providers/provider-status-badge';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activos', value: 'false' },
  { label: 'Mostrar inactivos', value: 'true' },
];

const providersSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const Route = createFileRoute('/_authed/providers/')({
  validateSearch: providersSearchSchema,
  component: ProvidersPage,
});

function ProvidersPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';
  const canDelete = role === 'Admin';

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [toDelete, setToDelete] = useState<Provider | null>(null);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      search: debouncedSearch,
      showInactive: search.showInactive,
    }),
    [search.page, debouncedSearch, search.showInactive],
  );

  const { data, isLoading, error, refetch } = useProviders(listQuery);

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

  const columns = useMemo<ColumnDef<Provider, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Nombre',
        accessorFn: (row: Provider) => row.name,
        cell: ({ row }) => (
          <Link
            to="/providers/$providerId"
            params={{ providerId: row.original.id }}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'companyName',
        header: 'Razón social',
        accessorFn: (row: Provider) => row.companyName,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'contactName',
        header: 'Contacto',
        accessorFn: (row: Provider) => row.contactName,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'contactPhone',
        header: 'Teléfono',
        accessorFn: (row: Provider) => row.contactPhone,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: Provider) => row.isActive,
        cell: ({ row }) => <ProviderStatusBadge isActive={row.original.isActive} />,
      },
      actionsColumn<Provider>('Acciones', (row) =>
        canWrite || canDelete ? (
          <div className="flex items-center gap-1">
            {canWrite ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(row)}
                aria-label="Editar"
              >
                <PencilSimpleIcon className="size-3.5" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setToDelete(row)}
                aria-label="Eliminar"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null,
      ),
    ],
    [canWrite, canDelete],
  );

  const emptyAction = canWrite ? (
    <Button onClick={() => setCreateOpen(true)}>
      <PlusIcon className="size-4" />
      Crear proveedor
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Proveedores</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} proveedores</p>
          ) : null}
        </div>
        {canWrite ? (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Nuevo proveedor
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <label htmlFor="providers-search" className="text-xs font-medium">
            Buscar
          </label>
          <Input
            id="providers-search"
            placeholder="Nombre, razón social o contacto…"
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
        emptyTitle="Sin proveedores"
        emptyDescription={
          canWrite ? 'Aún no hay proveedores. Creá el primero.' : 'No hay proveedores registrados.'
        }
        emptyAction={emptyAction}
        caption="Lista de proveedores"
      />

      <ProviderCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProviderEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        provider={editing}
      />
      <ProviderDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        provider={toDelete}
      />
    </div>
  );
}

export { Route };
