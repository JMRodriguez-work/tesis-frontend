import { Eye, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import { useItemCategories } from '@/api/queries/use-item-categories';
import { type ItemListRow, useDeleteItem, useItems } from '@/api/queries/use-items';
import { actionsColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { ItemStatusBadge } from '@/components/items/item-status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { useDebounce } from '@/hooks/use-debounce';
import { mapApiError } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import type { ListItemsQuery } from '@/lib/schemas/item';
import { cn } from '@/lib/utils';

const itemsSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  categoryId: z.string().default(''),
  showInactive: z.boolean().default(false),
});

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Solo activos', value: 'false' },
  { label: 'Mostrar inactivos', value: 'true' },
];

const Route = createFileRoute('/_authed/items/')({
  validateSearch: itemsSearchSchema,
  component: ItemsIndexPage,
});

function ItemsIndexPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const debouncedSearch = useDebounce(search.search, 300);
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();

  const [itemToDelete, setItemToDelete] = useState<ItemListRow | null>(null);
  const deleteItem = useDeleteItem();

  const branchIdForQuery = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const listQuery: ListItemsQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(search.categoryId ? { categoryId: search.categoryId } : {}),
      ...(search.showInactive ? { isActive: false } : {}),
      ...(branchIdForQuery ? { branchId: branchIdForQuery } : {}),
    }),
    [search.page, debouncedSearch, search.categoryId, search.showInactive, branchIdForQuery],
  );

  const itemsEnabled = role !== 'Admin' || !!currentBranchId;
  const { data, isLoading, error, refetch } = useItems(listQuery, { enabled: itemsEnabled });
  const { data: categories } = useItemCategories(
    { branchId: branchIdForQuery, isActive: true },
    { enabled: itemsEnabled },
  );

  const categoryItems: ComboboxItem[] = useMemo(
    () =>
      categories?.data.map((cat) => ({
        label: cat.name,
        value: cat.id,
      })) ?? [],
    [categories],
  );

  const handlePageChange = (newPage: number) => {
    void navigate({
      to: '.',
      search: { ...search, page: newPage },
    });
  };

  const handleSearchChange = (value: string) => {
    void navigate({
      to: '.',
      search: { ...search, search: value, page: 1 },
    });
  };

  const handleCategoryChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: {
        ...search,
        categoryId: value ?? '',
        page: 1,
      },
    });
  };

  const handleShowInactiveChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: { ...search, showInactive: value === 'true', page: 1 },
    });
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    deleteItem.mutate(itemToDelete.id, {
      onSuccess: () => {
        toast.success('Item eliminado');
        setItemToDelete(null);
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  const columns = useMemo(
    () => [
      textColumn<ItemListRow>('Nombre', 'name'),
      textColumn<ItemListRow>('Código', 'code'),
      {
        id: 'category',
        header: 'Categoría',
        accessorFn: (row: ItemListRow) => row.category?.name ?? null,
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ?? '—';
        },
      },
      {
        id: 'purchasePrice',
        header: 'Precio compra',
        accessorFn: (row: ItemListRow) => row.purchasePrice,
        cell: ({ getValue }) => formatCurrency(getValue() as string | null),
      },
      {
        id: 'salePrice',
        header: 'Precio venta',
        accessorFn: (row: ItemListRow) => row.salePrice,
        cell: ({ getValue }) => formatCurrency(getValue() as string | null),
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row: ItemListRow) => row.isActive,
        cell: ({ getValue }) => <ItemStatusBadge isActive={Boolean(getValue())} />,
      },
      actionsColumn<ItemListRow>('Acciones', (row) => (
        <div className="flex items-center gap-1">
          <Link
            to="/items/$itemId"
            params={{ itemId: row.id }}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <Eye className="size-3.5" />
          </Link>
          {role !== 'Employee' ? (
            <Link
              to="/items/$itemId/edit"
              params={{ itemId: row.id }}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            >
              <PencilSimple className="size-3.5" />
            </Link>
          ) : null}
          {role !== 'Employee' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setItemToDelete(row)}
              aria-label="Eliminar"
            >
              <Trash className="size-3.5" />
            </Button>
          ) : null}
        </div>
      )),
    ],
    [role],
  );

  const emptyAction =
    role !== 'Employee' ? (
      <Link to="/items/new" className={cn(buttonVariants())}>
        <Plus className="size-4" />
        Crear item
      </Link>
    ) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Items</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} items</p>
          ) : null}
        </div>
        {role !== 'Employee' ? (
          <Link to="/items/new" className={cn(buttonVariants())}>
            <Plus className="size-4" />
            Nuevo item
          </Link>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <label htmlFor="items-search" className="text-xs font-medium">
            Buscar
          </label>
          <Input
            id="items-search"
            placeholder="Nombre, código o barcode…"
            value={search.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <ComboboxField
          label="Categoría"
          items={categoryItems}
          value={search.categoryId || null}
          onValueChange={handleCategoryChange}
          placeholder="Todas las categorías"
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
        emptyTitle="Sin items"
        emptyDescription={
          role === 'Employee'
            ? 'No hay items registrados en esta sucursal.'
            : 'Aún no hay items. Creá el primero.'
        }
        emptyAction={emptyAction}
      />

      <Dialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar item</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{itemToDelete?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Route };
