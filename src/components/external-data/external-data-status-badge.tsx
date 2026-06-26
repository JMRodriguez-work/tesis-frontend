import { Badge } from '@/components/ui/badge';

type ExternalDataStatusBadgeProps = { isActive: boolean };

function ExternalDataStatusBadge({ isActive }: ExternalDataStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
  );
}

export { ExternalDataStatusBadge };
