import { BuildingsIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useWarehouses, type Warehouse } from '@/api/queries/use-warehouses';
import { actionsColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { WarehouseBranchesDialog } from '@/components/warehouses/warehouse-branches-dialog';
import { WarehouseBranchesList } from '@/components/warehouses/warehouse-branches-list';
import { WarehouseCreateDialog } from '@/components/warehouses/warehouse-create-dialog';
import { WarehouseDeleteDialog } from '@/components/warehouses/warehouse-delete-dialog';
import { WarehouseEditDialog } from '@/components/warehouses/warehouse-edit-dialog';
import { WarehouseStatusBadge } from '@/components/warehouses/warehouse-status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';

const warehousesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activos', value: 'false' },
  { label: 'Mostrar inactivos', value: 'true' },
];

const Route = createFileRoute('/_authed/warehouses/')({
  validateSearch: warehousesSearchSchema,
  component: WarehousesPage,
});

function WarehousesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin';

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [managingBranches, setManagingBranches] = useState<Warehouse | null>(null);
  const [toDelete, setToDelete] = useState<Warehouse | null>(null);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.showInactive ? { isActive: false } : { isActive: true }),
    }),
    [search.page, debouncedSearch, search.showInactive],
  );

  const { data, isLoading, error, refetch } = useWarehouses(listQuery);

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

  const columns = useMemo(
    () => [
      textColumn<Warehouse>('Nombre', 'name'),
      {
        id: 'description',
        header: 'Descripción',
        accessorFn: (row: Warehouse) => row.description,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'branches',
        header: 'Sucursales',
        accessorFn: (row: Warehouse) => row.branches,
        cell: ({ row }) => <WarehouseBranchesList branches={row.original.branches} />,
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: Warehouse) => row.isActive,
        cell: ({ row }) => <WarehouseStatusBadge isActive={row.original.isActive} />,
      },
      actionsColumn<Warehouse>('Acciones', (row) => (
        <div className="flex items-center gap-1">
          {canEdit ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(row)}
              aria-label="Editar"
            >
              <PencilSimpleIcon className="size-3.5" />
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setManagingBranches(row)}
              aria-label="Gestionar sucursales"
            >
              <BuildingsIcon className="size-3.5" />
            </Button>
          ) : null}
          {canEdit ? (
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
      )),
    ],
    [canEdit],
  );

  const emptyAction = canEdit ? (
    <Button onClick={() => setCreateOpen(true)}>
      <PlusIcon className="size-4" />
      Crear depósito
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Depósitos</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} depósitos</p>
          ) : null}
        </div>
        {canEdit ? (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Nuevo depósito
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <label htmlFor="warehouses-search" className="text-xs font-medium">
            Buscar
          </label>
          <Input
            id="warehouses-search"
            placeholder="Nombre del depósito…"
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
        emptyTitle="Sin depósitos"
        emptyDescription={
          canEdit ? 'Aún no hay depósitos. Creá el primero.' : 'No hay depósitos registrados.'
        }
        emptyAction={emptyAction}
      />

      <WarehouseCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <WarehouseEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        warehouse={editing}
      />
      <WarehouseBranchesDialog
        open={managingBranches !== null}
        onOpenChange={(open) => {
          if (!open) setManagingBranches(null);
        }}
        warehouse={managingBranches}
      />
      <WarehouseDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        warehouse={toDelete}
      />
    </div>
  );
}

export { Route };
