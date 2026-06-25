import { Badge } from '@/components/ui/badge';

type CustomerStatusBadgeProps = { isActive: boolean };

function CustomerStatusBadge({ isActive }: CustomerStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
  );
}

export { CustomerStatusBadge };
