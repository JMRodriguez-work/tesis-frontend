import type { StockStatus } from '@/api/queries/use-stock';
import { Badge } from '@/components/ui/badge';

type StockStatusBadgeProps = { status: StockStatus };

const LABEL: Record<StockStatus, string> = {
  out: 'Sin stock',
  low: 'Bajo',
  ok: 'OK',
};

function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const variant = status === 'out' ? 'destructive' : status === 'low' ? 'secondary' : 'default';
  return <Badge variant={variant}>{LABEL[status]}</Badge>;
}

export { StockStatusBadge };
