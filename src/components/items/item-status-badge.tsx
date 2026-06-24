import { Badge } from '@/components/ui/badge';

type ItemStatusBadgeProps = {
  isActive: boolean;
};

function ItemStatusBadge({ isActive }: ItemStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
  );
}

export { ItemStatusBadge };
