import { useEffect } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useBranches } from '@/api/queries/use-branches';
import { useClearBranch, useSetBranches, useSetCurrentBranch } from '@/hooks/use-branch';
import { useBranchStore } from '@/lib/branch-store';
import { roleFromId } from '@/lib/role';

// External sync entre TanStack Query (`useBranches`, `useMe`) y el store de Zustand.
// Caso válido del AGENTS §2.1.2. Garantiza que `currentBranchId` siempre tiene un valor
// válido mientras haya branches en la org, así las páginas Admin no necesitan manejar
// el caso "sin branch activa" en cada query.
function BranchHydrator() {
  const { data: me, isLoading: isLoadingMe } = useMe();
  const setBranches = useSetBranches();
  const setCurrentBranch = useSetCurrentBranch();
  const clearBranch = useClearBranch();
  const branchesQuery = useBranches({ limit: 100 });
  const role = roleFromId(me?.roleId ?? null);

  useEffect(() => {
    if (isLoadingMe) return;
    if (!me) {
      clearBranch();
      return;
    }

    const branches = branchesQuery.data?.data ?? [];

    if (branches.length === 0) {
      setBranches([]);
      return;
    }

    setBranches(branches);

    const persistedId = useBranchStore.getState().currentBranchId;
    const isValid = (id: string | null) => id !== null && branches.some((b) => b.id === id);

    if (role === 'Admin') {
      if (!isValid(persistedId)) {
        const first = branches[0];
        if (first) setCurrentBranch(first.id);
      }
      return;
    }

    const meBranchId = me.branchId;
    if (meBranchId && meBranchId !== persistedId) {
      if (isValid(meBranchId)) {
        setCurrentBranch(meBranchId);
      } else if (!isValid(persistedId)) {
        const first = branches[0];
        if (first) setCurrentBranch(first.id);
      }
    }
  }, [me, isLoadingMe, branchesQuery.data, role, setBranches, setCurrentBranch, clearBranch]);

  return null;
}

export { BranchHydrator };
