import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { TopItem, TopItemsData } from '@/api/queries/use-reports';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatDecimal } from '@/lib/format';

const topItemsChartConfig: ChartConfig = {
  totalRevenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
};

function formatCurrencyTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
}

type TopItemsChartProps = {
  data: TopItemsData;
  chartLimit?: number;
};

function TopItemsChart({ data, chartLimit = 10 }: TopItemsChartProps) {
  const chartItems = useMemo(
    () => data.data.slice(0, Math.min(chartLimit, data.data.length)),
    [data.data, chartLimit],
  );

  if (data.data.length === 0) {
    return (
      <EmptyState
        title="Sin datos en el período"
        description="No hay ventas registradas en el rango seleccionado."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={topItemsChartConfig} className="h-72 w-full">
        <BarChart
          data={chartItems}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatCurrencyTick}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="itemName"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            width={120}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const num = typeof value === 'number' ? value : Number(value);
                  return formatCurrency(num);
                }}
                hideIndicator
              />
            }
          />
          <Bar dataKey="totalRevenue" fill="var(--color-totalRevenue)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
              <TableHead>Última venta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: TopItem) => (
              <TableRow key={item.itemId}>
                <TableCell>
                  <Link
                    to="/items/$itemId"
                    params={{ itemId: item.itemId }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.itemName}
                    {item.itemCode ? (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({item.itemCode})
                      </span>
                    ) : null}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{item.categoryName ?? '—'}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatDecimal(item.totalQuantitySold)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatCurrency(item.totalRevenue)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatDecimal(item.transactionCount)}
                </TableCell>
                <TableCell className="text-xs">{formatDate(item.lastSoldAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { TopItemsChart };
