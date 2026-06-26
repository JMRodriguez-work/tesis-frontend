import { Navigate } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { roleFromId, type UserRole } from '@/lib/role';

type RoleGuardProps = {
  allow: readonly UserRole[];
  children: ReactNode;
  redirectTo?: string;
};

function RoleGuard({ allow, children, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { data: me, isLoading } = useMe();
  const role = me ? roleFromId(me.roleId) : null;
  const allowed = role !== null && allow.includes(role);

  useEffect(() => {
    if (!isLoading && !allowed && me) {
      toast.error('No tenés permisos para acceder a esta sección');
    }
  }, [isLoading, allowed, me]);

  if (isLoading) return null;
  if (!me) return <Navigate to="/login" />;
  if (!allowed) return <Navigate to={redirectTo} />;
  return <>{children}</>;
}

export { RoleGuard };
