import { Badge } from '@/components/ui/badge';

type ProviderStatusBadgeProps = { isActive: boolean };

function ProviderStatusBadge({ isActive }: ProviderStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
  );
}

export { ProviderStatusBadge };
