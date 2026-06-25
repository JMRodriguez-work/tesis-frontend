import { z } from 'zod';

export const listRecommendationsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  type: z.enum(['restock', 'pricing', 'trend', 'seasonal', 'retention']).nullable().default(null),
  status: z.enum(['pending', 'applied', 'dismissed']).nullable().default('pending'),
  itemId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  openId: z.string().uuid().optional(),
});

export type ListRecommendationsQuery = z.infer<typeof listRecommendationsQuerySchema>;
