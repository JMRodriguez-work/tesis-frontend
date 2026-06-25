import type { RecommendationStatus } from '@/api/queries/use-recommendations';
import { Badge } from '@/components/ui/badge';

type RecommendationStatusBadgeProps = { status: RecommendationStatus };

const LABEL: Record<RecommendationStatus, string> = {
  pending: 'Pendiente',
  applied: 'Aplicada',
  dismissed: 'Descartada',
};

const VARIANT: Record<RecommendationStatus, 'secondary' | 'default' | 'outline'> = {
  pending: 'secondary',
  applied: 'default',
  dismissed: 'outline',
};

function RecommendationStatusBadge({ status }: RecommendationStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}

export { RecommendationStatusBadge };
