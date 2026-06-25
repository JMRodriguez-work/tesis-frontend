import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { SalesTrendData } from '@/api/queries/use-reports';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const salesTrendConfig: ChartConfig = {
  totalSales: {
    label: 'Ventas',
    color: 'var(--chart-1)',
  },
  transactionCount: {
    label: 'Transacciones',
    color: 'var(--chart-2)',
  },
};

function formatCurrencyTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
}

function formatBucketLabel(bucket: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(d);
}

type SalesTrendChartProps = {
  data: SalesTrendData;
};

function SalesTrendChart({ data }: SalesTrendChartProps) {
  if (data.data.length === 0) {
    return (
      <EmptyState
        title="Sin datos en el período"
        description="No hay ventas registradas en el rango seleccionado."
      />
    );
  }

  const chartData = data.data.map((b) => ({
    bucket: formatBucketLabel(b.bucket),
    totalSales: Number(b.totalSales),
    transactionCount: b.transactionCount,
  }));

  return (
    <ChartContainer config={salesTrendConfig} className="h-72 w-full">
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis
          yAxisId="left"
          tickFormatter={formatCurrencyTick}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : Number(value);
                if (name === 'totalSales') {
                  return new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 2,
                  }).format(num);
                }
                return num.toLocaleString('es-AR');
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalSales"
          stroke="var(--color-totalSales)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="transactionCount"
          stroke="var(--color-transactionCount)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export { SalesTrendChart };
