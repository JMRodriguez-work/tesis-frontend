import { type Branch, useBranchStore } from '@/lib/branch-store';

export function useCurrentBranch(): Branch | null {
  const currentBranchId = useBranchStore((s) => s.currentBranchId);
  const branches = useBranchStore((s) => s.branches);
  if (!currentBranchId) return null;
  return branches.find((b) => b.id === currentBranchId) ?? null;
}

export function useCurrentBranchId(): string | null {
  return useBranchStore((s) => s.currentBranchId);
}

export function useBranchesList(): Branch[] {
  return useBranchStore((s) => s.branches);
}

export function useSetCurrentBranch(): (id: string | null) => void {
  return useBranchStore((s) => s.setCurrentBranch);
}

export function useSetBranches(): (branches: Branch[]) => void {
  return useBranchStore((s) => s.setBranches);
}

export function useClearBranch(): () => void {
  return useBranchStore((s) => s.clear);
}
