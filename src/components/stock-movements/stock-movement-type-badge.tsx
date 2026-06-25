import {
  ArrowLineDownIcon,
  ArrowLineUpIcon,
  ArrowsLeftRightIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';
import type { StockMovementType } from '@/api/queries/use-stock-movements';
import { Badge } from '@/components/ui/badge';

type StockMovementTypeBadgeProps = {
  type: StockMovementType;
};

const TYPE_CONFIG: Record<
  StockMovementType,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  in: {
    label: 'Entrada',
    variant: 'default',
    icon: <ArrowLineDownIcon className="size-3" weight="bold" />,
  },
  out: {
    label: 'Salida',
    variant: 'destructive',
    icon: <ArrowLineUpIcon className="size-3" weight="bold" />,
  },
  transfer: {
    label: 'Transferencia',
    variant: 'secondary',
    icon: <ArrowsLeftRightIcon className="size-3" weight="bold" />,
  },
  adjustment: {
    label: 'Ajuste',
    variant: 'outline',
    icon: <PencilSimpleIcon className="size-3" weight="bold" />,
  },
};

function StockMovementTypeBadge({ type }: StockMovementTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export { StockMovementTypeBadge };
