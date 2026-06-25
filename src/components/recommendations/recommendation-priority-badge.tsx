import type { RecommendationPriority } from '@/api/queries/use-recommendations';
import { Badge } from '@/components/ui/badge';

type RecommendationPriorityBadgeProps = { priority: RecommendationPriority };

const LABEL: Record<RecommendationPriority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const VARIANT: Record<RecommendationPriority, 'destructive' | 'default' | 'secondary'> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
};

function RecommendationPriorityBadge({ priority }: RecommendationPriorityBadgeProps) {
  return <Badge variant={VARIANT[priority]}>{LABEL[priority]}</Badge>;
}

export { RecommendationPriorityBadge };
