import { ListIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useMe, useSignOut } from '@/api/queries/use-auth';
import { BranchSelector } from '@/components/layout/branch-selector';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { RoleBadge } from '@/components/users/role-badge';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';

function Topbar() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const signOut = useSignOut();
  const role = roleFromId(me?.roleId ?? null);

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        void navigate({ to: '/login' });
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger aria-label="Abrir menú lateral">
          <ListIcon className="size-4" />
        </SidebarTrigger>
        <BranchSelector />
      </div>
      <div className="flex items-center gap-1">
        <NotificationsBell />
        {role ? <RoleBadge role={role} className="mr-2" /> : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button variant="ghost" size="sm" {...props}>
                <UserIcon className="size-4" />
                <span className="hidden sm:inline">{me?.name ?? me?.email ?? 'Cuenta'}</span>
              </Button>
            )}
          />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {[me?.name, me?.email].filter(Boolean).join(' · ') || 'Mi cuenta'}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              closeOnClick={false}
              onClick={handleSignOut}
              disabled={signOut.isPending}
            >
              <SignOutIcon className="size-4" />
              <span>{signOut.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { Topbar };
