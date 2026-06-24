import { PencilSimpleIcon, PlusIcon, TrashIcon, UserSwitchIcon } from '@phosphor-icons/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useBranches } from '@/api/queries/use-branches';
import { type User, useUsers } from '@/api/queries/use-users';
import { actionsColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { RoleBadge } from '@/components/users/role-badge';
import { UserChangeRoleDialog } from '@/components/users/user-change-role-dialog';
import { UserCreateDialog } from '@/components/users/user-create-dialog';
import { UserDeleteDialog } from '@/components/users/user-delete-dialog';
import { UserEditDialog } from '@/components/users/user-edit-dialog';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';

const usersSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  roleId: z.string().default(''),
  branchId: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const ROLE_FILTER_ITEMS: ComboboxItem[] = [
  { label: 'Todos los roles', value: '' },
  { label: 'Admin', value: '1' },
  { label: 'Manager', value: '2' },
  { label: 'Employee', value: '3' },
];

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activos', value: 'false' },
  { label: 'Mostrar inactivos', value: 'true' },
];

const Route = createFileRoute('/_authed/settings/users')({
  validateSearch: usersSearchSchema,
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin';
  const { data: branchesData } = useBranches({ limit: 100, isActive: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [changingRoleFor, setChangingRoleFor] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.roleId ? { roleId: Number(search.roleId) } : {}),
      ...(search.branchId ? { branchId: search.branchId } : {}),
      ...(search.showInactive ? { isActive: false } : { isActive: true }),
    }),
    [search.page, debouncedSearch, search.roleId, search.branchId, search.showInactive],
  );

  const { data, isLoading, error, refetch } = useUsers(listQuery);

  const branchItems: ComboboxItem[] = useMemo(
    () => [
      { label: 'Todas las sucursales', value: '' },
      ...(branchesData?.data.map((b) => ({ label: b.name, value: b.id })) ?? []),
    ],
    [branchesData],
  );

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };

  const handleSearchChange = (value: string) => {
    void navigate({ to: '.', search: { ...search, search: value, page: 1 } });
  };

  const handleRoleChange = (value: string | null) => {
    void navigate({ to: '.', search: { ...search, roleId: value ?? '', page: 1 } });
  };

  const handleBranchChange = (value: string | null) => {
    void navigate({ to: '.', search: { ...search, branchId: value ?? '', page: 1 } });
  };

  const handleShowInactiveChange = (value: string | null) => {
    void navigate({ to: '.', search: { ...search, showInactive: value === 'true', page: 1 } });
  };

  const columns = useMemo(
    () => [
      textColumn<User>('Nombre', 'name'),
      textColumn<User>('Email', 'email'),
      {
        id: 'role',
        header: 'Rol',
        accessorFn: (row: User) => row.role?.name ?? null,
        cell: ({ row }) => <RoleBadge role={roleFromId(row.original.roleId ?? null)} />,
      },
      {
        id: 'branch',
        header: 'Sucursal',
        accessorFn: (row: User) => row.branch?.name ?? null,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: User) => row.isActive,
        cell: ({ getValue }) => <UserStatusBadge isActive={Boolean(getValue())} />,
      },
      actionsColumn<User>('Acciones', (row) => (
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
              onClick={() => setChangingRoleFor(row)}
              aria-label="Cambiar rol"
            >
              <UserSwitchIcon className="size-3.5" />
            </Button>
          ) : null}
          {canEdit && row.id !== me?.id ? (
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
    [canEdit, me?.id],
  );

  const emptyAction = canEdit ? (
    <Button onClick={() => setCreateOpen(true)}>
      <PlusIcon className="size-4" />
      Crear usuario
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Usuarios</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} usuarios</p>
          ) : null}
        </div>
        {canEdit ? (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Nuevo usuario
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <label htmlFor="users-search" className="text-xs font-medium">
            Buscar
          </label>
          <Input
            id="users-search"
            placeholder="Nombre o email…"
            value={search.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <ComboboxField
          label="Rol"
          items={ROLE_FILTER_ITEMS}
          value={search.roleId || null}
          onValueChange={handleRoleChange}
          placeholder="Todos los roles"
          className="w-44"
        />
        <ComboboxField
          label="Sucursal"
          items={branchItems}
          value={search.branchId || null}
          onValueChange={handleBranchChange}
          placeholder="Todas las sucursales"
          className="w-56"
        />
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
        emptyTitle="Sin usuarios"
        emptyDescription={
          canEdit ? 'Aún no hay usuarios. Creá el primero.' : 'No hay usuarios en la organización.'
        }
        emptyAction={emptyAction}
      />

      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void refetch();
        }}
      />
      <UserEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        user={editing}
      />
      <UserChangeRoleDialog
        open={changingRoleFor !== null}
        onOpenChange={(open) => {
          if (!open) setChangingRoleFor(null);
        }}
        user={changingRoleFor}
      />
      <UserDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        user={toDelete}
      />
    </div>
  );
}

export { Route };
