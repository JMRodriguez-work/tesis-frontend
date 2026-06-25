import { z } from 'zod';

const intervalSchema = z.enum(['day', 'week', 'month']);
const sortBySchema = z.enum(['quantity', 'revenue']);

const rangeFields = {
  from: z.string().nullable().default(null),
  to: z.string().nullable().default(null),
};

export const salesTrendSearchSchema = z.object({
  ...rangeFields,
  interval: intervalSchema.default('day'),
});

export const revenueTimelineSearchSchema = z.object({
  ...rangeFields,
  interval: intervalSchema.default('day'),
});

export const topItemsSearchSchema = z.object({
  ...rangeFields,
  sortBy: sortBySchema.nullable().default(null),
  limit: z.number().int().min(1).max(100).default(20),
});

export const categoryDistributionSearchSchema = z.object({
  ...rangeFields,
});

export type SalesTrendSearch = z.infer<typeof salesTrendSearchSchema>;
export type RevenueTimelineSearch = z.infer<typeof revenueTimelineSearchSchema>;
export type TopItemsSearch = z.infer<typeof topItemsSearchSchema>;
export type CategoryDistributionSearch = z.infer<typeof categoryDistributionSearchSchema>;
