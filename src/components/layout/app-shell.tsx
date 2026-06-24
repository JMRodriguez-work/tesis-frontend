import type { ReactNode } from 'react';
import { MainSidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type AppShellProps = { children: ReactNode };

function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { AppShell };
