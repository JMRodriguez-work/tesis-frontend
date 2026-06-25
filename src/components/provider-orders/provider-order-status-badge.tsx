import type { ProviderOrderStatus } from '@/api/queries/use-provider-orders';
import { Badge } from '@/components/ui/badge';

type ProviderOrderStatusBadgeProps = { status: ProviderOrderStatus };

const LABEL: Record<ProviderOrderStatus, string> = {
  pending: 'Pendiente',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

const VARIANT: Record<ProviderOrderStatus, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  received: 'default',
  cancelled: 'destructive',
};

function ProviderOrderStatusBadge({ status }: ProviderOrderStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}

export { ProviderOrderStatusBadge };
