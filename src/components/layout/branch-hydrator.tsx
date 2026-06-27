import { useEffect } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useBranches } from '@/api/queries/use-branches';
import { useSetBranches, useSetCurrentBranch } from '@/hooks/use-branch';
import { useBranchStore } from '@/lib/branch-store';
import { roleFromId } from '@/lib/role';

function BranchHydrator() {
  const { data: me } = useMe();
  const setBranches = useSetBranches();
  const setCurrentBranch = useSetCurrentBranch();
  const branchesQuery = useBranches({ limit: 100 });
  const role = roleFromId(me?.roleId ?? null);

  useEffect(() => {
    const branches = branchesQuery.data?.data ?? [];
    if (branches.length === 0) return;
    setBranches(branches);

    const persistedId = useBranchStore.getState().currentBranchId;
    const isValid = (id: string | null) =>
      id !== null && branches.some((b) => b.id === id);

    if (role === 'Admin') {
      if (!isValid(persistedId)) {
        const first = branches[0];
        if (first) setCurrentBranch(first.id);
      }
      return;
    }

    const meBranchId = me?.branchId ?? null;
    if (meBranchId && meBranchId !== persistedId) {
      if (isValid(meBranchId)) {
        setCurrentBranch(meBranchId);
      } else if (!isValid(persistedId)) {
        const first = branches[0];
        if (first) setCurrentBranch(first.id);
      }
    }
  }, [branchesQuery.data, role, me?.branchId, setBranches, setCurrentBranch]);

  return null;
}

export { BranchHydrator };
