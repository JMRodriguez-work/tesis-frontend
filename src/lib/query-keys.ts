export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (q: object) => [...branchKeys.lists(), q] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
};

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (q: object) => [...itemKeys.lists(), q] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
  barcode: (code: string) => [...itemKeys.all, 'barcode', code] as const,
  stock: (id: string) => [...itemKeys.all, 'stock', id] as const,
};

export const itemCategoryKeys = {
  all: ['item-categories'] as const,
  lists: () => [...itemCategoryKeys.all, 'list'] as const,
  list: (q: object) => [...itemCategoryKeys.lists(), q] as const,
  details: () => [...itemCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemCategoryKeys.details(), id] as const,
};

export const unitKeys = {
  all: ['units'] as const,
  list: () => [...unitKeys.all, 'list'] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (q: object) => [...customerKeys.lists(), q] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (q: object) => [...saleKeys.lists(), q] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (q: object) => [...warehouseKeys.lists(), q] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};
