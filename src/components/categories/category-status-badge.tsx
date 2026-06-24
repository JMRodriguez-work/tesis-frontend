import { Badge } from '@/components/ui/badge';

type CategoryStatusBadgeProps = {
  isActive: boolean;
};

function CategoryStatusBadge({ isActive }: CategoryStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
  );
}

export { CategoryStatusBadge };
