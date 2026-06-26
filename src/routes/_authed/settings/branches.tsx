import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type BranchItem, useBranches } from '@/api/queries/use-branches';
import { RoleGuard } from '@/components/auth/role-guard';
import { BranchCreateDialog } from '@/components/branches/branch-create-dialog';
import { BranchDeleteDialog } from '@/components/branches/branch-delete-dialog';
import { BranchEditDialog } from '@/components/branches/branch-edit-dialog';
import { BranchStatusBadge } from '@/components/branches/branch-status-badge';
import { actionsColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';

const branchesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activas', value: 'false' },
  { label: 'Mostrar inactivas', value: 'true' },
];

const Route = createFileRoute('/_authed/settings/branches')({
  validateSearch: branchesSearchSchema,
  component: BranchesPage,
});

function BranchesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin';

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BranchItem | null>(null);
  const [toDelete, setToDelete] = useState<BranchItem | null>(null);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.showInactive ? { isActive: false } : { isActive: true }),
    }),
    [search.page, debouncedSearch, search.showInactive],
  );

  const { data, isLoading, error, refetch } = useBranches(listQuery);

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
      textColumn<BranchItem>('Nombre', 'name'),
      {
        id: 'organization',
        header: 'Organización',
        accessorFn: (row: BranchItem) => row.organization?.name ?? null,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: BranchItem) => row.isActive,
        cell: ({ getValue }) => <BranchStatusBadge isActive={Boolean(getValue())} />,
      },
      actionsColumn<BranchItem>('Acciones', (row) => (
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
      Crear sucursal
    </Button>
  ) : null;

  return (
    <RoleGuard allow={['Admin']}>
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Sucursales</h1>
            {data?.meta.total !== undefined ? (
              <p className="text-xs text-muted-foreground">{data.meta.total} sucursales</p>
            ) : null}
          </div>
          {canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Nueva sucursal
            </Button>
          ) : null}
        </header>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <label htmlFor="branches-search" className="text-xs font-medium">
              Buscar
            </label>
            <Input
              id="branches-search"
              placeholder="Nombre de la sucursal…"
              value={search.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <ComboboxField
            label="Estado"
            items={STATUS_ITEMS}
            value={search.showInactive ? 'true' : 'false'}
            onValueChange={handleShowInactiveChange}
            placeholder="Solo activas"
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
          emptyTitle="Sin sucursales"
          emptyDescription={
            canEdit
              ? 'Aún no hay sucursales. Creá la primera.'
              : 'No hay sucursales registradas en la organización.'
          }
          emptyAction={emptyAction}
        />

        <BranchCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
        <BranchEditDialog
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          branch={editing}
        />
        <BranchDeleteDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          branch={toDelete}
        />
      </div>
    </RoleGuard>
  );
}

export { Route };
