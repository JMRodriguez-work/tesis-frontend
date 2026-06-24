import { ListIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useMe, useSignOut } from '@/api/queries/use-auth';
import { BranchSelector } from '@/components/layout/branch-selector';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { mapApiError } from '@/lib/api-error';

function Topbar() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const signOut = useSignOut();

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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm">
              <UserIcon className="size-4" />
              <span className="hidden sm:inline">{me?.name ?? me?.email ?? 'Cuenta'}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuLabel>{me ? `${me.name} · ${me.email}` : 'Mi cuenta'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Perfil</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            disabled={signOut.isPending}
          >
            <SignOutIcon className="size-4" />
            <span>{signOut.isPending ? 'Cerrando…' : 'Cerrar sesión'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { Topbar };
