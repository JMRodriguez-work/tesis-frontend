import { Card, CardContent } from '@/components/ui/card';
import { formatDecimal } from '@/lib/format';
import type { CustomerSegment } from '@/lib/schemas/customer-analytics';
import { cn } from '@/lib/utils';
import { SEGMENT_CONFIG } from './segment-badge';

type SegmentSummaryGridProps = {
  customers: { segment: CustomerSegment }[];
};

const SEGMENT_ORDER: CustomerSegment[] = [
  'vip',
  'frequent',
  'occasional',
  'new',
  'inactive',
  'dormant',
];

function SegmentSummaryGrid({ customers }: SegmentSummaryGridProps) {
  const counts = new Map<CustomerSegment, number>();
  for (const c of customers) {
    counts.set(c.segment, (counts.get(c.segment) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-muted-foreground">
        Conteos aproximados de la página actual (no del total de la organización).
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {SEGMENT_ORDER.map((segment) => {
          const config = SEGMENT_CONFIG[segment];
          const count = counts.get(segment) ?? 0;
          const isEmpty = count === 0;
          return (
            <Card
              key={segment}
              size="sm"
              className={cn('flex flex-row items-center gap-2', isEmpty && 'opacity-50')}
            >
              <CardContent className="flex flex-row items-center gap-2 py-0">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-none border',
                    config.variant === 'destructive' && 'border-destructive/30 bg-destructive/5',
                    config.variant === 'default' && 'border-foreground/10 bg-foreground/5',
                    config.variant === 'secondary' && 'border-border bg-muted',
                    config.variant === 'outline' && 'border-border bg-background',
                  )}
                >
                  <span
                    className={cn(
                      config.variant === 'destructive' && 'text-destructive',
                      config.variant === 'default' && 'text-foreground',
                      config.variant === 'secondary' && 'text-muted-foreground',
                      config.variant === 'outline' && 'text-muted-foreground',
                    )}
                  >
                    {config.icon}
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {config.label}
                  </span>
                  <span className="text-lg font-semibold tabular-nums leading-none">
                    {formatDecimal(count)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export type { SegmentSummaryGridProps };
export { SEGMENT_ORDER, SegmentSummaryGrid };
