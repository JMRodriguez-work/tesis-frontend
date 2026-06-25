import {
  ClockCounterClockwiseIcon,
  CrownIcon,
  RepeatIcon,
  UserCircleMinusIcon,
  UserCirclePlusIcon,
  UserPlusIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import type { CustomerSegment } from '@/lib/schemas/customer-analytics';

type SegmentBadgeProps = { segment: CustomerSegment };

const SEGMENT_CONFIG: Record<
  CustomerSegment,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  vip: {
    label: 'VIP',
    variant: 'default',
    icon: <CrownIcon className="size-3" weight="bold" />,
  },
  frequent: {
    label: 'Frecuente',
    variant: 'default',
    icon: <RepeatIcon className="size-3" weight="bold" />,
  },
  occasional: {
    label: 'Ocasional',
    variant: 'secondary',
    icon: <ClockCounterClockwiseIcon className="size-3" weight="bold" />,
  },
  new: {
    label: 'Nuevo',
    variant: 'outline',
    icon: <UserPlusIcon className="size-3" weight="bold" />,
  },
  inactive: {
    label: 'Inactivo',
    variant: 'destructive',
    icon: <UserCircleMinusIcon className="size-3" weight="bold" />,
  },
  dormant: {
    label: 'Dormido',
    variant: 'destructive',
    icon: <UserCirclePlusIcon className="size-3" weight="bold" />,
  },
};

function SegmentBadge({ segment }: SegmentBadgeProps) {
  const config = SEGMENT_CONFIG[segment];
  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export type { SegmentBadgeProps };
export { SEGMENT_CONFIG, SegmentBadge };
