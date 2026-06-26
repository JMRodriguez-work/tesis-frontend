import type { ReactNode } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { MainSidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { roleFromId } from '@/lib/role';

type AppShellProps = { children: ReactNode };

function AppShell({ children }: AppShellProps) {
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);

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
