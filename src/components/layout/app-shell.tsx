import type { ReactNode } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/feedback/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { roleFromId } from '@/lib/role';

type AppShellProps = { children: ReactNode };

function AppShell({ children }: AppShellProps) {
  const { data: me, isLoading } = useMe();
  const role = roleFromId(me?.roleId ?? null);

  if (isLoading) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-muted/30">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <MainSidebar role={role} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { AppShell };
