import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  branchIds: z.array(z.string().uuid('Sucursal inválida')).min(1, 'Asigná al menos una sucursal'),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type CreateWarehouseFormValues = z.input<typeof createWarehouseSchema>;

export const updateWarehouseSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres').optional(),
  description: z.string().max(2000, 'Máximo 2000 caracteres').nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type UpdateWarehouseFormValues = z.input<typeof updateWarehouseSchema>;

export const assignBranchSchema = z.object({
  branchId: z.string().uuid('Sucursal inválida'),
});

export type AssignBranchInput = z.infer<typeof assignBranchSchema>;

export const listWarehousesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type ListWarehousesQuery = z.infer<typeof listWarehousesQuerySchema>;
