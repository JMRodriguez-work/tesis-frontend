import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { fetchBranches } from '@/api/queries/use-branches';
import { fetchMe } from '@/api/queries/use-auth';
import { AuthedPending } from '@/components/layout/authed-pending';
import { AppShell } from '@/components/layout/app-shell';
import { BranchHydrator } from '@/components/layout/branch-hydrator';
import { useBranchStore } from '@/lib/branch-store';
import { authKeys } from '@/lib/query-keys';
import { branchKeys } from '@/lib/query-keys';
import { roleFromId } from '@/lib/role';

const Route = createFileRoute('/_authed')({
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

    const branches = await context.queryClient.fetchQuery({
      queryKey: branchKeys.list({ limit: 100 }),
      queryFn: () => fetchBranches({ limit: 100 }),
      staleTime: 60_000,
    });

    const store = useBranchStore.getState();
    const branchList = branches.data;
    store.setBranches(branchList);

    const role = roleFromId(me.roleId);
    const persistedId = store.currentBranchId;
    const isValid = (id: string | null) =>
      id !== null && branchList.some((b) => b.id === id);

    if (role === 'Admin') {
      if (!isValid(persistedId)) {
        const first = branchList[0];
        if (first) store.setCurrentBranch(first.id);
      }
    } else {
      const meBranchId = me.branchId;
      if (meBranchId && meBranchId !== persistedId) {
        if (isValid(meBranchId)) {
          store.setCurrentBranch(meBranchId);
        } else if (!isValid(persistedId)) {
          const first = branchList[0];
          if (first) store.setCurrentBranch(first.id);
        }
      }
    }

    return { me };
  },
  pendingComponent: AuthedPending,
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
