import { z } from 'zod';

export const customerSegmentSchema = z.enum([
  'vip',
  'frequent',
  'occasional',
  'new',
  'inactive',
  'dormant',
]);

export const detectInactiveCustomersSchema = z.object({
  days: z.number().int().min(1, 'Mínimo 1 día').max(365, 'Máximo 365 días').default(60),
});

export type DetectInactiveCustomersInput = z.infer<typeof detectInactiveCustomersSchema>;
export type DetectInactiveCustomersFormValues = z.input<typeof detectInactiveCustomersSchema>;

export const listCustomerSegmentsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  segment: customerSegmentSchema.nullable().default(null),
});

export type ListCustomerSegmentsQuery = z.infer<typeof listCustomerSegmentsQuerySchema>;
export type CustomerSegment = z.infer<typeof customerSegmentSchema>;
