import { Cell, Pie, PieChart } from 'recharts';
import type { CategoryDistributionData, CategorySlice } from '@/api/queries/use-reports';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import { formatCurrency, formatDecimal } from '@/lib/format';

const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

const categoryDistributionConfig: ChartConfig = {
  totalRevenue: {
    label: 'Revenue',
  },
};

function buildCategoryConfig(slices: CategorySlice[]): ChartConfig {
  const config: ChartConfig = { ...categoryDistributionConfig };
  slices.forEach((s, i) => {
    const key = s.categoryId ?? 'uncategorized';
    config[key] = {
      label: s.categoryName,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    };
  });
  return config;
}

type CategoryDistributionChartProps = {
  data: CategoryDistributionData;
};

function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  if (data.data.length === 0) {
    return (
      <EmptyState
        title="Sin datos en el período"
        description="No hay ventas registradas en el rango seleccionado."
      />
    );
  }

  const config = buildCategoryConfig(data.data);
  const chartData = data.data.map((s) => ({
    name: s.categoryName,
    value: Number(s.totalRevenue),
    key: s.categoryId ?? 'uncategorized',
  }));

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={config} className="mx-auto h-72 w-full max-w-md">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                formatter={(value) => {
                  const num = typeof value === 'number' ? value : Number(value);
                  return formatCurrency(num);
                }}
                hideIndicator
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            strokeWidth={2}
            stroke="var(--background)"
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} verticalAlign="bottom" />
        </PieChart>
      </ChartContainer>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
              <TableHead className="text-right">Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((s) => (
              <TableRow key={s.categoryId ?? 'uncategorized'}>
                <TableCell className="font-medium">{s.categoryName}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatCurrency(s.totalRevenue)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatDecimal(s.transactionCount)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatDecimal(s.itemCount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { CategoryDistributionChart };
