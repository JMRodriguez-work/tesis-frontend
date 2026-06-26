import { CalendarIcon, CurrencyDollarIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import type { ExternalDataSourceType } from '@/lib/schemas/external-data';

type ExternalDataTypeBadgeProps = { type: ExternalDataSourceType };

const TYPE_CONFIG: Record<
  ExternalDataSourceType,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline';
    icon: React.ReactNode;
  }
> = {
  wholesale_prices: {
    label: 'Precios mayoristas',
    variant: 'default',
    icon: <CurrencyDollarIcon className="size-3" weight="bold" />,
  },
  search_trends: {
    label: 'Tendencias de búsqueda',
    variant: 'secondary',
    icon: <MagnifyingGlassIcon className="size-3" weight="bold" />,
  },
  seasonality: {
    label: 'Estacionalidad',
    variant: 'outline',
    icon: <CalendarIcon className="size-3" weight="bold" />,
  },
};

export const EXTERNAL_DATA_TYPE_LABELS: Record<ExternalDataSourceType, string> = Object.fromEntries(
  Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.label]),
) as Record<ExternalDataSourceType, string>;

function ExternalDataTypeBadge({ type }: ExternalDataTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export { ExternalDataTypeBadge };
