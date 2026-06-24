import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  isActive: z.boolean().optional().default(true),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = z.object({
  name: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const listBranchesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
