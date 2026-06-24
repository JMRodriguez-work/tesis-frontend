import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { fetchMe } from '@/api/queries/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { BranchHydrator } from '@/components/layout/branch-hydrator';
import { authKeys } from '@/lib/query-keys';

const Route = createFileRoute('/_authed/route')({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.fetchQuery({
      queryKey: authKeys.me(),
      queryFn: fetchMe,
      staleTime: 60_000,
    });
    if (!me) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    if (!me.organizationId) {
      throw redirect({ to: '/onboarding' });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <AppShell>
      <BranchHydrator />
      <Outlet />
    </AppShell>
  );
}

export { Route };
