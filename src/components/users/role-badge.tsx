import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { UserRole } from '@/lib/role';

type RoleBadgeProps = {
  role: UserRole | null;
  className?: string;
};

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

function variantForRole(role: UserRole | null): BadgeVariant {
  if (role === 'Admin') return 'default';
  if (role === 'Manager') return 'secondary';
  return 'outline';
}

function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) {
    return (
      <Badge variant="outline" className={className}>
        Sin rol
      </Badge>
    );
  }
  return (
    <Badge variant={variantForRole(role)} className={className}>
      {role}
    </Badge>
  );
}

export { RoleBadge };
