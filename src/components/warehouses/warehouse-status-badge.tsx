import { Badge } from '@/components/ui/badge';

function WarehouseStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'default' : 'outline'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
  );
}

export { WarehouseStatusBadge };
