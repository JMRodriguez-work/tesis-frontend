import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import { useMe } from '@/api/queries/use-auth';
import {
  useCategoryDistribution,
  useRevenueTimeline,
  useSalesTrend,
  useTopItems,
} from '@/api/queries/use-reports';
import { CategoryDistributionChart } from '@/components/reports/category-distribution-chart';
import { ChartCard } from '@/components/reports/chart-card';
import { IntervalSelector } from '@/components/reports/interval-selector';
import { RevenueTimelineChart } from '@/components/reports/revenue-timeline-chart';
import { SalesTrendChart } from '@/components/reports/sales-trend-chart';
import { TopItemsChart } from '@/components/reports/top-items-chart';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  type DateRange,
  DateRangePicker,
  parseISODate,
  toISODate,
} from '@/components/ui/date-range-picker';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';

const SORTBY_ITEMS: ComboboxItem[] = [
  { label: 'Por revenue', value: 'revenue' },
  { label: 'Por cantidad', value: 'quantity' },
];

const reportsSearchSchema = z.object({
  stFrom: z.string().nullable().default(null),
  stTo: z.string().nullable().default(null),
  stInterval: z.enum(['day', 'week', 'month']).default('day'),
  rtFrom: z.string().nullable().default(null),
  rtTo: z.string().nullable().default(null),
  rtInterval: z.enum(['day', 'week', 'month']).default('day'),
  tiFrom: z.string().nullable().default(null),
  tiTo: z.string().nullable().default(null),
  tiSortBy: z.enum(['revenue', 'quantity']).nullable().default(null),
  tiLimit: z.number().int().min(1).max(100).default(20),
  cdFrom: z.string().nullable().default(null),
  cdTo: z.string().nullable().default(null),
});

const Route = createFileRoute('/_authed/reports/')({
  validateSearch: reportsSearchSchema,
  component: ReportsIndexPage,
});

function ReportsIndexPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const stRange = useMemo<DateRange>(
    () => ({ from: parseISODate(search.stFrom), to: parseISODate(search.stTo) }),
    [search.stFrom, search.stTo],
  );
  const rtRange = useMemo<DateRange>(
    () => ({ from: parseISODate(search.rtFrom), to: parseISODate(search.rtTo) }),
    [search.rtFrom, search.rtTo],
  );
  const tiRange = useMemo<DateRange>(
    () => ({ from: parseISODate(search.tiFrom), to: parseISODate(search.tiTo) }),
    [search.tiFrom, search.tiTo],
  );
  const cdRange = useMemo<DateRange>(
    () => ({ from: parseISODate(search.cdFrom), to: parseISODate(search.cdTo) }),
    [search.cdFrom, search.cdTo],
  );

  const setRange = useCallback(
    (key: 'st' | 'rt' | 'ti' | 'cd', range: DateRange) => {
      const fromKey = `${key}From` as const;
      const toKey = `${key}To` as const;
      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          [fromKey]: toISODate(range.from),
          [toKey]: toISODate(range.to),
        }),
      });
    },
    [navigate],
  );

  const setInterval = useCallback(
    (key: 'st' | 'rt', value: 'day' | 'week' | 'month') => {
      const intervalKey = `${key}Interval` as const;
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, [intervalKey]: value }),
      });
    },
    [navigate],
  );

  const setTiSortBy = useCallback(
    (value: 'revenue' | 'quantity' | null) => {
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, tiSortBy: value }),
      });
    },
    [navigate],
  );

  const enabled = role !== 'Admin' || !!currentBranchId;

  const salesTrend = useSalesTrend(
    {
      from: search.stFrom,
      to: search.stTo,
      interval: search.stInterval,
      ...(adminBranchId ? { branchId: adminBranchId } : {}),
    },
    { enabled },
  );

  const revenueTimeline = useRevenueTimeline(
    {
      from: search.rtFrom,
      to: search.rtTo,
      interval: search.rtInterval,
      ...(adminBranchId ? { branchId: adminBranchId } : {}),
    },
    { enabled },
  );

  const topItems = useTopItems(
    {
      from: search.tiFrom,
      to: search.tiTo,
      sortBy: search.tiSortBy,
      limit: search.tiLimit,
      ...(adminBranchId ? { branchId: adminBranchId } : {}),
    },
    { enabled },
  );

  const categoryDistribution = useCategoryDistribution(
    {
      from: search.cdFrom,
      to: search.cdTo,
      ...(adminBranchId ? { branchId: adminBranchId } : {}),
    },
    { enabled },
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Reportes</h1>
        <p className="text-xs text-muted-foreground">Métricas y tendencias de tu organización</p>
      </header>

      <ChartCard
        title="Tendencia de ventas"
        subtitle="Ventas y transacciones agrupadas por intervalo"
        isLoading={salesTrend.isLoading}
        error={salesTrend.error}
        controls={
          <>
            <DateRangePicker value={stRange} onChange={(r) => setRange('st', r)} />
            <IntervalSelector
              value={search.stInterval}
              onChange={(v) => setInterval('st', v)}
              className="w-40"
            />
          </>
        }
      >
        {salesTrend.data ? <SalesTrendChart data={salesTrend.data} /> : null}
      </ChartCard>

      <ChartCard
        title="Revenue timeline"
        subtitle="Revenue agrupado por intervalo (sin transacciones)"
        isLoading={revenueTimeline.isLoading}
        error={revenueTimeline.error}
        controls={
          <>
            <DateRangePicker value={rtRange} onChange={(r) => setRange('rt', r)} />
            <IntervalSelector
              value={search.rtInterval}
              onChange={(v) => setInterval('rt', v)}
              className="w-40"
            />
          </>
        }
      >
        {revenueTimeline.data ? <RevenueTimelineChart data={revenueTimeline.data} /> : null}
      </ChartCard>

      <ChartCard
        title="Top items"
        subtitle="Items más vendidos por revenue o cantidad"
        isLoading={topItems.isLoading}
        error={topItems.error}
        controls={
          <>
            <DateRangePicker value={tiRange} onChange={(r) => setRange('ti', r)} />
            <ComboboxField
              label="Ordenar por"
              items={SORTBY_ITEMS}
              value={search.tiSortBy}
              onValueChange={(v) => {
                if (v === 'revenue' || v === 'quantity') setTiSortBy(v);
                else setTiSortBy(null);
              }}
              placeholder="Por revenue"
              className="w-40"
            />
          </>
        }
      >
        {topItems.data ? (
          <TopItemsChart data={topItems.data} chartLimit={Math.min(search.tiLimit, 10)} />
        ) : null}
      </ChartCard>

      <ChartCard
        title="Distribución por categoría"
        subtitle="Revenue agrupado por categoría"
        isLoading={categoryDistribution.isLoading}
        error={categoryDistribution.error}
        controls={<DateRangePicker value={cdRange} onChange={(r) => setRange('cd', r)} />}
      >
        {categoryDistribution.data ? (
          <CategoryDistributionChart data={categoryDistribution.data} />
        ) : null}
      </ChartCard>
    </div>
  );
}

export { Route };
