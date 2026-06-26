import {
  CloudArrowDownIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import {
  type ExternalDataSource,
  useEnqueueFetchExternalData,
  useExternalDataSources,
} from '@/api/queries/use-external-data';
import { RoleGuard } from '@/components/auth/role-guard';
import { DataTable } from '@/components/data-table/data-table';
import { ExternalDataSourceCreateDialog } from '@/components/external-data/external-data-source-create-dialog';
import { ExternalDataSourceDeleteDialog } from '@/components/external-data/external-data-source-delete-dialog';
import { ExternalDataSourceEditDialog } from '@/components/external-data/external-data-source-edit-dialog';
import { ExternalDataStatusBadge } from '@/components/external-data/external-data-status-badge';
import { ExternalDataTypeBadge } from '@/components/external-data/external-data-type-badge';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { mapApiError } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Solo activas', value: 'active' },
  { label: 'Solo inactivas', value: 'inactive' },
];

const TYPE_FILTER_ITEMS: ComboboxItem[] = [
  { label: 'Todos los tipos', value: 'all' },
  { label: 'Precios mayoristas', value: 'wholesale_prices' },
  { label: 'Tendencias de búsqueda', value: 'search_trends' },
  { label: 'Estacionalidad', value: 'seasonality' },
];

const externalDataSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  isActive: z.boolean().nullable().default(null),
  type: z.enum(['wholesale_prices', 'search_trends', 'seasonality']).nullable().default(null),
});

const Route = createFileRoute('/_authed/settings/external-data')({
  validateSearch: externalDataSearchSchema,
  component: ExternalDataPage,
});

function ExternalDataPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin';
  const canFetch = role === 'Admin' || role === 'Manager';

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalDataSource | null>(null);
  const [toDelete, setToDelete] = useState<ExternalDataSource | null>(null);

  const enqueueFetch = useEnqueueFetchExternalData();

  const listQuery = useMemo(
    () => ({
      page: search.page,
      limit: 20,
      isActive: search.isActive,
      type: search.type,
    }),
    [search.page, search.isActive, search.type],
  );

  const { data, isLoading, error, refetch } = useExternalDataSources(listQuery);

  const handlePageChange = (newPage: number) => {
    void navigate({ to: '.', search: { ...search, page: newPage } });
  };

  const handleStatusChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: {
        ...search,
        isActive: value === 'active' ? true : value === 'inactive' ? false : null,
        page: 1,
      },
    });
  };

  const handleTypeChange = (value: string | null) => {
    void navigate({
      to: '.',
      search: {
        ...search,
        type:
          value === 'wholesale_prices' || value === 'search_trends' || value === 'seasonality'
            ? value
            : null,
        page: 1,
      },
    });
  };

  const handleFetchNow = useCallback(
    (source: ExternalDataSource) => {
      enqueueFetch.mutate(source.id, {
        onSuccess: (data) => {
          const shortId = data.jobId.slice(0, 8);
          toast.success(`Job encolado (${shortId}…). Los resultados aparecerán al refrescar.`);
        },
        onError: (err) => toast.error(mapApiError(err).message),
      });
    },
    [enqueueFetch],
  );

  const columns = useMemo<ColumnDef<ExternalDataSource, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Nombre',
        accessorFn: (row) => row.name,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'type',
        header: 'Tipo',
        accessorFn: (row) => row.type,
        cell: ({ row }) => <ExternalDataTypeBadge type={row.original.type} />,
      },
      {
        id: 'url',
        header: 'URL',
        accessorFn: (row) => row.url,
        cell: ({ row }) =>
          row.original.url ? (
            <a
              href={row.original.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-xs truncate text-brand-600 hover:underline"
              title={row.original.url}
            >
              {row.original.url}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'auth',
        header: 'Auth',
        accessorFn: (row) => row.authConfig,
        cell: ({ row }) => {
          const ac = row.original.authConfig;
          if (!ac || typeof ac !== 'object') {
            return <span className="text-muted-foreground">—</span>;
          }
          const hasHeaders = 'hasHeaders' in ac ? ac.hasHeaders : false;
          const hasQueryParams = 'hasQueryParams' in ac ? ac.hasQueryParams : false;
          if (!hasHeaders && !hasQueryParams) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex gap-1">
              {hasHeaders ? <span className="text-xs">Headers</span> : null}
              {hasQueryParams ? <span className="text-xs">Query params</span> : null}
            </div>
          );
        },
      },
      {
        id: 'isActive',
        header: 'Estado',
        accessorFn: (row) => row.isActive,
        cell: ({ row }) => <ExternalDataStatusBadge isActive={row.original.isActive} />,
      },
      {
        id: 'lastFetchedAt',
        header: 'Última ejecución',
        accessorFn: (row) => row.lastFetchedAt,
        cell: ({ row }) =>
          row.original.lastFetchedAt ? (
            formatDate(row.original.lastFetchedAt)
          ) : (
            <span className="text-muted-foreground">Nunca</span>
          ),
      },
      {
        id: 'lastError',
        header: 'Error',
        accessorFn: (row) => row.lastError,
        cell: ({ row }) => {
          const err = row.original.lastError;
          if (!err) return <span className="text-muted-foreground">—</span>;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <WarningIcon className="size-4 cursor-help text-destructive" weight="fill" />
                  }
                />
                <TooltipContent className="max-w-md">
                  <p className="break-words">{err}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const source = row.original;
          if (!canFetch && !canWrite) return null;
          return (
            <div className="flex items-center gap-1">
              {canFetch ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFetchNow(source)}
                  disabled={enqueueFetch.isPending}
                  aria-label="Fetch now"
                >
                  <CloudArrowDownIcon className="size-3.5" />
                  Fetch now
                </Button>
              ) : null}
              {canWrite ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(source)}
                    aria-label="Editar"
                  >
                    <PencilSimpleIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setToDelete(source)}
                    aria-label="Eliminar"
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [canWrite, canFetch, enqueueFetch.isPending, handleFetchNow],
  );

  const emptyAction = canWrite ? (
    <Button onClick={() => setCreateOpen(true)}>
      <PlusIcon className="size-4" />
      Nueva fuente
    </Button>
  ) : null;

  const statusValue = search.isActive === null ? 'all' : search.isActive ? 'active' : 'inactive';
  const typeValue = search.type ?? 'all';

  return (
    <RoleGuard allow={['Admin']}>
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Datos externos</h1>
            <p className="text-xs text-muted-foreground">
              Fuentes de datos externos que alimentan las recomendaciones. El sistema corre un fetch
              diario automático.
            </p>
          </div>
          {canWrite ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Nueva fuente
            </Button>
          ) : null}
        </header>

        <div className="flex flex-wrap items-end gap-2">
          <ComboboxField
            label="Tipo"
            items={TYPE_FILTER_ITEMS}
            value={typeValue}
            onValueChange={handleTypeChange}
            placeholder="Todos los tipos"
            className="w-56"
          />
          <ComboboxField
            label="Estado"
            items={STATUS_ITEMS}
            value={statusValue}
            onValueChange={handleStatusChange}
            placeholder="Todas"
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
          emptyTitle="Sin fuentes externas"
          emptyDescription={
            canWrite
              ? 'Aún no hay fuentes configuradas. Creá la primera para empezar a recibir datos.'
              : 'No hay fuentes externas registradas.'
          }
          emptyAction={emptyAction}
          caption="Lista de fuentes de datos externos"
        />

        <p className="text-xs text-muted-foreground">
          El sistema corre un fetch automático diario. Usá "Fetch now" para forzar una ejecución
          inmediata.
        </p>

        <ExternalDataSourceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
        <ExternalDataSourceEditDialog
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          source={editing}
        />
        <ExternalDataSourceDeleteDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          source={toDelete}
        />
      </div>
    </RoleGuard>
  );
}

export { Route };
