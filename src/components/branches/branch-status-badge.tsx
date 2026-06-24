import { Badge } from '@/components/ui/badge';

type BranchStatusBadgeProps = {
  isActive: boolean;
};

function BranchStatusBadge({ isActive }: BranchStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
  );
}

export { BranchStatusBadge };
