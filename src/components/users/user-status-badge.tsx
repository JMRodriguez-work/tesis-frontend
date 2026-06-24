import { Badge } from '@/components/ui/badge';

type UserStatusBadgeProps = {
  isActive: boolean;
};

function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
  );
}

export { UserStatusBadge };
