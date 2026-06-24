import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Branch = {
  id: string;
  name: string;
  isActive: boolean;
  organizationId: string;
};

type BranchState = {
  currentBranchId: string | null;
  branches: Branch[];
  setCurrentBranch: (id: string | null) => void;
  setBranches: (branches: Branch[]) => void;
  clear: () => void;
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      currentBranchId: null,
      branches: [],
      setCurrentBranch: (id) => {
        set({ currentBranchId: id });
      },
      setBranches: (branches) => {
        set({ branches });
      },
      clear: () => {
        set({ currentBranchId: null, branches: [] });
      },
    }),
    {
      name: 'tfg-branch',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentBranchId: state.currentBranchId }),
    },
  ),
);
