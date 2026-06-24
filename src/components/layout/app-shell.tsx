import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

type AppShellProps = { children: ReactNode };

function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-svh w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export { AppShell };
