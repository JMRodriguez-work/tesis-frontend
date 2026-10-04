import type { UserRole } from '@/lib/role';

export type NavLinkKey =
  | 'dashboard'
  | 'items'
  | 'sales'
  | 'customers'
  | 'segments'
  | 'warehouses'
  | 'stock-movements'
  | 'low-stock'
  | 'providers'
  | 'provider-orders'
  | 'reports'
  | 'recommendations'
  | 'settings-organization'
  | 'settings-branches'
  | 'settings-categories'
  | 'settings-users'
  | 'settings-external-data';

export const LINK_VISIBILITY: Record<NavLinkKey, readonly UserRole[]> = {
  dashboard: ['Admin', 'Manager', 'Employee'],
  items: ['Admin', 'Manager', 'Employee'],
  sales: ['Admin', 'Manager', 'Employee'],
  customers: ['Admin', 'Manager', 'Employee'],
  segments: ['Admin', 'Manager', 'Employee'],
  warehouses: ['Admin', 'Manager', 'Employee'],
  'stock-movements': ['Admin', 'Manager', 'Employee'],
  'low-stock': ['Admin', 'Manager'],
  providers: ['Admin', 'Manager', 'Employee'],
  'provider-orders': ['Admin', 'Manager', 'Employee'],
  reports: ['Admin', 'Manager', 'Employee'],
  recommendations: ['Admin', 'Manager', 'Employee'],
  'settings-organization': ['Admin'],
  'settings-branches': ['Admin'],
  'settings-categories': ['Admin', 'Manager'],
  'settings-users': ['Admin'],
  'settings-external-data': ['Admin'],
};

export function canSeeLink(role: UserRole | null, key: NavLinkKey): boolean {
  if (!role) return false;
  return LINK_VISIBILITY[key].includes(role);
}
