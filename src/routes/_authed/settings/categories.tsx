import { EyeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { type Category, useItemCategories } from '@/api/queries/use-item-categories';
import { RoleGuard } from '@/components/auth/role-guard';
import { CategoryDeleteDialog } from '@/components/categories/category-delete-dialog';
import { CategoryStatusBadge } from '@/components/categories/category-status-badge';
import { actionsColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { CategoryCreateDialog } from '@/components/items/category-create-dialog';
import { CategoryEditDialog } from '@/components/items/category-edit-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { useDebounce } from '@/hooks/use-debounce';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const categoriesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activas', value: 'false' },
  { label: 'Mostrar inactivas', value: 'true' },
];

const Route = createFileRoute('/_authed/settings/categories')({
  validateSearch: categoriesSearchSchema,
  component: CategoriesPage,
});

function CategoriesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const currentBranchId = useCurrentBranchId();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const branchIdForQuery = role === 'Admin' ? currentBranchId : null;

  const listQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.showInactive ? { isActive: false } : { isActive: true }),
      ...(branchIdForQuery ? { branchId: branchIdForQuery } : {}),
    }),
    [search.page, debouncedSearch, search.showInactive, branchIdForQuery],
  );

  const { data, isLoading, error, refetch } = useItemCategories(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };

  const handleSearchChange = (value: string) => {
    void navigate({ to: '.', search: { ...search, search: value, page: 1 } });
  };

  const handleShowInactiveChange = (value: string | null) => {
    void navigate({ to: '.', search: { ...search, showInactive: value === 'true', page: 1 } });
  };

  const columns = useMemo(
    () => [
      textColumn<Category>('Nombre', 'name'),
      textColumn<Category>('Descripción', 'description'),
      {
        id: 'branch',
        header: 'Sucursal',
        accessorFn: (row: Category) => row.branch?.name ?? null,
        cell: ({ getValue }) => (getValue() as string | null) ?? '—',
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: Category) => row.isActive,
        cell: ({ getValue }) => <CategoryStatusBadge isActive={Boolean(getValue())} />,
      },
      actionsColumn<Category>('Acciones', (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Ver" disabled>
            <EyeIcon className="size-3.5" />
          </Button>
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
    <Button onClick={() => setCreateOpen(true)} className={cn(buttonVariants())}>
      <PlusIcon className="size-4" />
      Crear categoría
    </Button>
  ) : null;

  return (
    <RoleGuard allow={['Admin', 'Manager']}>
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Categorías</h1>
            {data?.meta.total !== undefined ? (
              <p className="text-xs text-muted-foreground">{data.meta.total} categorías</p>
            ) : null}
          </div>
          {canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Nueva categoría
            </Button>
          ) : null}
        </header>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <label htmlFor="categories-search" className="text-xs font-medium">
              Buscar
            </label>
            <Input
              id="categories-search"
              placeholder="Nombre de la categoría…"
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
          emptyTitle="Sin categorías"
          emptyDescription={
            canEdit
              ? 'Aún no hay categorías. Creá la primera.'
              : 'No hay categorías registradas en esta sucursal.'
          }
          emptyAction={emptyAction}
        />

        <CategoryDeleteDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          category={toDelete}
        />

        <CategoryCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          branchId={role === 'Admin' ? (currentBranchId ?? undefined) : undefined}
        />
        <CategoryEditDialog
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          category={editing}
        />
      </div>
    </RoleGuard>
  );
}

export { Route };
