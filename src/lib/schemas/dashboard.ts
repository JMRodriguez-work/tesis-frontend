import { z } from 'zod';

export const listProductRotationQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  from: z.string().nullable().default(null),
  to: z.string().nullable().default(null),
  categoryId: z.string().uuid().nullable().default(null),
  includeZeroSales: z.boolean().nullable().default(null),
  branchId: z.string().uuid().optional(),
});

export type ListProductRotationQuery = z.infer<typeof listProductRotationQuerySchema>;
