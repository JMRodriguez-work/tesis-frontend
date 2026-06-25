import type { SaleStatus } from '@/api/queries/use-sales';
import { Badge } from '@/components/ui/badge';

type SaleStatusBadgeProps = { status: SaleStatus };

const LABEL: Record<SaleStatus, string> = {
  active: 'Activa',
  cancelled: 'Cancelada',
};

const VARIANT: Record<SaleStatus, 'default' | 'destructive'> = {
  active: 'default',
  cancelled: 'destructive',
};

function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}

export { SaleStatusBadge };
