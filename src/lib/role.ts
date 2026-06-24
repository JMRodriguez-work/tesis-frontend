import type { UserRole } from '@/types/auth';

export type { UserRole };

const roleIdMap: Record<number, UserRole> = {
  1: 'Admin',
  2: 'Manager',
  3: 'Employee',
};

export function roleFromId(roleId: number | null | undefined): UserRole | null {
  if (roleId === null || roleId === undefined) return null;
  return roleIdMap[roleId] ?? null;
}
