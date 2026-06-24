import { useEffect } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useBranches } from '@/api/queries/use-branches';
import { useClearBranch, useSetBranches } from '@/hooks/use-branch';

function BranchHydrator() {
  const { data: me, isLoading } = useMe();
  const setBranches = useSetBranches();
  const clearBranch = useClearBranch();
  const branchesQuery = useBranches({ limit: 100 });

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      clearBranch();
      return;
    }
    if (branchesQuery.data?.data) {
      setBranches(branchesQuery.data.data);
    }
  }, [me, isLoading, branchesQuery.data, setBranches, clearBranch]);

  return null;
}

export { BranchHydrator };
