import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@phosphor-icons/react';
import { Skeleton } from '@/components/feedback/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDecimal } from '@/lib/format';

type SalesSummaryCardProps = {
  title: string;
  totalSales: string;
  transactionCount: number;
  averageTicket: string;
  dateLabel?: string;
  delta?: number | null;
  isLoading?: boolean;
};

function formatDelta(delta: number | null): string {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function deltaVariant(delta: number | null): 'default' | 'destructive' | 'secondary' {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return 'secondary';
  if (delta > 0) return 'default';
  if (delta < 0) return 'destructive';
  return 'secondary';
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === undefined || Number.isNaN(delta)) {
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusIcon className="size-3" />—
      </Badge>
    );
  }
  if (delta === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusIcon className="size-3" />
        0.0%
      </Badge>
    );
  }
  const Icon = delta > 0 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <Badge variant={deltaVariant(delta)} className="gap-1">
      <Icon className="size-3" weight="bold" />
      {formatDelta(delta)}
    </Badge>
  );
}

function SalesSummaryCard({
  title,
  totalSales,
  transactionCount,
  averageTicket,
  dateLabel,
  delta,
  isLoading,
}: SalesSummaryCardProps) {
  return (
    <Card size="sm" className="flex flex-col gap-2">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
          <DeltaBadge delta={delta ?? null} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(totalSales)}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {formatDecimal(transactionCount)}
              </span>{' '}
              transacciones · ticket promedio{' '}
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(averageTicket)}
              </span>
            </p>
            {dateLabel ? <p className="text-[10px] text-muted-foreground">{dateLabel}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export type { SalesSummaryCardProps };
export { SalesSummaryCard };
