import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useInactiveCustomers } from '@/api/queries/use-dashboard';
import { InactiveCustomersCard } from '@/components/dashboard/inactive-customers-card';
import { ProductRotationTable } from '@/components/dashboard/product-rotation-table';
import { SalesSummaryGrid } from '@/components/dashboard/sales-summary-grid';
import { Skeleton } from '@/components/feedback/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type DateRange,
  DateRangePicker,
  parseISODate,
  toISODate,
} from '@/components/ui/date-range-picker';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';
import { listProductRotationQuerySchema } from '@/lib/schemas/dashboard';

const dashboardSearchSchema = listProductRotationQuerySchema.pick({
  page: true,
  categoryId: true,
  includeZeroSales: true,
  from: true,
  to: true,
});

const Route = createFileRoute('/_authed/dashboard')({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const { data: inactive } = useInactiveCustomers(
    adminBranchId ? { branchId: adminBranchId, limit: 5 } : { limit: 5 },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      void navigate({ to: '.', search: { ...search, page: newPage } });
    },
    [navigate, search],
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      void navigate({
        to: '.',
        search: { ...search, categoryId: value, page: 1 },
      });
    },
    [navigate, search],
  );

  const handleIncludeZeroSalesChange = useCallback(
    (value: boolean | null) => {
      void navigate({
        to: '.',
        search: { ...search, includeZeroSales: value, page: 1 },
      });
    },
    [navigate, search],
  );

  const handleRangeChange = useCallback(
    (range: DateRange) => {
      void navigate({
        to: '.',
        search: { ...search, from: toISODate(range.from), to: toISODate(range.to), page: 1 },
      });
    },
    [navigate, search],
  );

  const rotationRange = useMemo<DateRange>(
    () => ({ from: parseISODate(search.from), to: parseISODate(search.to) }),
    [search.from, search.to],
  );

  const inactiveList = useMemo(() => inactive?.data ?? [], [inactive]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Inicio</h1>
        <p className="text-xs text-muted-foreground">Resumen de operaciones de tu organización</p>
      </header>

      {showBranchWarning ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Sucursal no seleccionada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Seleccioná una sucursal activa en el selector del topbar para ver métricas de ventas.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Resumen de ventas</h2>
        <SalesSummaryGrid />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Clientes inactivos con alerta</h2>
        {role === 'Admin' && !currentBranchId ? (
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Seleccioná una sucursal para ver los clientes inactivos.
              </p>
            </CardContent>
          </Card>
        ) : inactive === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <InactiveCustomersCard customers={inactiveList} total={inactive?.meta.total ?? 0} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-medium">Rotación de productos</h2>
          <DateRangePicker value={rotationRange} onChange={handleRangeChange} />
        </div>
        <ProductRotationTable
          page={search.page}
          from={search.from}
          to={search.to}
          categoryId={search.categoryId}
          includeZeroSales={search.includeZeroSales}
          onPageChange={handlePageChange}
          onCategoryChange={handleCategoryChange}
          onIncludeZeroSalesChange={handleIncludeZeroSalesChange}
        />
      </section>
    </div>
  );
}

export { Route };
