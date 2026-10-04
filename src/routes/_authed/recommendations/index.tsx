import { EyeIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMe } from '@/api/queries/use-auth';
import {
  type RecommendationListRow,
  type RecommendationStatus,
  useRecommendations,
} from '@/api/queries/use-recommendations';
import { actionsColumn, dateColumn, textColumn } from '@/components/data-table/column-defs';
import { DataTable } from '@/components/data-table/data-table';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { RecommendationPriorityBadge } from '@/components/recommendations/recommendation-priority-badge';
import { RecommendationStatusBadge } from '@/components/recommendations/recommendation-status-badge';
import { RecommendationTypeBadge } from '@/components/recommendations/recommendation-type-badge';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';
import { listRecommendationsQuerySchema } from '@/lib/schemas/recommendation';

const TYPE_ITEMS: ComboboxItem[] = [
  { label: 'Todos los tipos', value: null },
  { label: 'Restock', value: 'restock' },
  { label: 'Estacional', value: 'seasonal' },
  { label: 'Retención', value: 'retention' },
];

const STATUS_ITEMS: ComboboxItem[] = [
  { label: 'Pendientes', value: 'pending' },
  { label: 'Todas', value: null },
  { label: 'Aplicadas', value: 'applied' },
  { label: 'Descartadas', value: 'dismissed' },
];

const recommendationsSearchSchema = listRecommendationsQuerySchema.pick({
  page: true,
  type: true,
  status: true,
  openId: true,
});

const Route = createFileRoute('/_authed/recommendations/')({
  validateSearch: recommendationsSearchSchema,
  component: RecommendationsIndexPage,
});

function RecommendationsIndexPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const [openId, setOpenId] = useState<string | null>(search.openId ?? null);

  useEffect(() => {
    if (search.openId && search.openId !== openId) {
      setOpenId(search.openId);
    }
  }, [search.openId, openId]);

  const listQuery = useMemo(
    () => ({
      page: search.page,
      type: search.type,
      status: search.status,
      ...(adminBranchId ? { branchId: adminBranchId } : {}),
    }),
    [search.page, search.type, search.status, adminBranchId],
  );

  const { data, isLoading, error, refetch } = useRecommendations(listQuery, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      void navigate({ to: '.', search: { ...search, page: newPage } });
    },
    [navigate, search],
  );
  const handleTypeChange = (value: string | null) => {
    const next =
      value === 'restock' ||
      value === 'pricing' ||
      value === 'trend' ||
      value === 'seasonal' ||
      value === 'retention'
        ? value
        : null;
    void navigate({ to: '.', search: { ...search, type: next, page: 1 } });
  };
  const handleStatusChange = (value: string | null) => {
    const next: RecommendationStatus | null =
      value === 'pending' || value === 'applied' || value === 'dismissed' ? value : null;
    void navigate({ to: '.', search: { ...search, status: next, page: 1 } });
  };
  const handleViewDetail = useCallback((id: string) => setOpenId(id), []);
  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setOpenId(null);
      if (search.openId) {
        void navigate({ to: '.', search: { ...search, openId: undefined } });
      }
    }
  };

  const columns = useMemo<ColumnDef<RecommendationListRow, unknown>[]>(
    () => [
      {
        id: 'type',
        header: 'Tipo',
        accessorFn: (row) => row.type,
        cell: ({ row }) => <RecommendationTypeBadge type={row.original.type} />,
      },
      {
        id: 'priority',
        header: 'Prioridad',
        accessorFn: (row) => row.priority,
        cell: ({ row }) => <RecommendationPriorityBadge priority={row.original.priority} />,
      },
      {
        id: 'description',
        header: 'Descripción',
        accessorFn: (row) => row.description,
        cell: ({ getValue }) => {
          const v = getValue();
          return (
            <span
              className="line-clamp-2 max-w-md text-xs text-foreground"
              title={typeof v === 'string' ? v : undefined}
            >
              {typeof v === 'string' ? v : ''}
            </span>
          );
        },
      },
      {
        id: 'item',
        header: 'Item',
        accessorFn: (row) => row.itemName,
        cell: ({ row }) => {
          const m = row.original;
          if (!m.itemId || !m.itemName) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <Link
              to="/items/$itemId"
              params={{ itemId: m.itemId }}
              className="text-foreground text-xs hover:underline"
            >
              {m.itemName}
            </Link>
          );
        },
      },
      {
        id: 'customer',
        header: 'Cliente',
        accessorFn: (row) => row.customerFullname,
        cell: ({ row }) => {
          const m = row.original;
          if (m.type !== 'retention' || !m.customerId || !m.customerFullname) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <Link
              to="/customers/$customerId"
              params={{ customerId: m.customerId }}
              className="text-foreground text-xs hover:underline"
            >
              {m.customerFullname}
            </Link>
          );
        },
      },
      textColumn<RecommendationListRow>('Sucursal', 'branchName'),
      {
        id: 'status',
        header: 'Estado',
        accessorFn: (row) => row.status,
        cell: ({ row }) => <RecommendationStatusBadge status={row.original.status} />,
      },
      dateColumn<RecommendationListRow>('Generada', 'generatedAt', false),
      actionsColumn<RecommendationListRow>('Acciones', (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row.id)}>
          <EyeIcon className="size-3.5" />
          Ver detalle
        </Button>
      )),
    ],
    [handleViewDetail],
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Recomendaciones</h1>
          {data?.meta.total !== undefined ? (
            <p className="text-xs text-muted-foreground">{data.meta.total} recomendaciones</p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <ComboboxField
          label="Tipo"
          items={TYPE_ITEMS}
          value={search.type}
          onValueChange={handleTypeChange}
          placeholder="Todos los tipos"
          className="w-48"
        />
        <ComboboxField
          label="Estado"
          items={STATUS_ITEMS}
          value={search.status}
          onValueChange={handleStatusChange}
          placeholder="Pendientes"
          className="w-48"
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
        emptyTitle="Sin recomendaciones"
        emptyDescription="No hay recomendaciones que coincidan con los filtros."
        caption="Lista de recomendaciones"
      />

      <RecommendationDetailDialog
        open={openId !== null}
        onOpenChange={handleCloseDialog}
        recommendationId={openId}
      />
    </div>
  );
}

export { Route };
