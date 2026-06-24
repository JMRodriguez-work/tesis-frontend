export type UserRole = 'Admin' | 'Manager' | 'Employee';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  branchId: string | null;
  roleId: number | null;
  isActive: boolean;
};

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser };
