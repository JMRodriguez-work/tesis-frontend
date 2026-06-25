import {
  ArrowUDownLeftIcon,
  CalendarDotIcon,
  ChartLineUpIcon,
  TagIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import type { RecommendationType } from '@/api/queries/use-recommendations';
import { Badge } from '@/components/ui/badge';

type RecommendationTypeBadgeProps = { type: RecommendationType };

const TYPE_CONFIG: Record<
  RecommendationType,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  restock: {
    label: 'Restock',
    variant: 'default',
    icon: <ArrowUDownLeftIcon className="size-3" weight="bold" />,
  },
  pricing: {
    label: 'Precio',
    variant: 'secondary',
    icon: <TagIcon className="size-3" weight="bold" />,
  },
  trend: {
    label: 'Tendencia',
    variant: 'outline',
    icon: <ChartLineUpIcon className="size-3" weight="bold" />,
  },
  seasonal: {
    label: 'Estacional',
    variant: 'outline',
    icon: <CalendarDotIcon className="size-3" weight="bold" />,
  },
  retention: {
    label: 'Retención',
    variant: 'destructive',
    icon: <UserCircleIcon className="size-3" weight="bold" />,
  },
};

function RecommendationTypeBadge({ type }: RecommendationTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export { RecommendationTypeBadge };
