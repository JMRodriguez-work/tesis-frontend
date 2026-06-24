import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { roleFromId, type UserRole } from '@/lib/role';

type RoleGuardProps = { allow: readonly UserRole[]; children: ReactNode };

function RoleGuard({ allow, children }: RoleGuardProps) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (!me) return <Navigate to="/login" />;
  const role = roleFromId(me.roleId);
  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
}

export { RoleGuard };
