import { z } from 'zod';

const priceStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Decimal inválido (ej: 100 o 99.50)');

const codeStringSchema = z.string().trim().min(1, 'Requerido').max(100, 'Máximo 100 caracteres');

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  categoryId: z.string().uuid('Categoría inválida').optional(),
  baseUnitId: z.number().int().positive('Unidad inválida').optional(),
  purchasePrice: priceStringSchema.optional(),
  salePrice: priceStringSchema.optional(),
  code: codeStringSchema.optional(),
  barcode: codeStringSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  baseUnitId: z.number().int().positive().nullable().optional(),
  purchasePrice: priceStringSchema.nullable().optional(),
  salePrice: priceStringSchema.nullable().optional(),
  code: codeStringSchema.nullable().optional(),
  barcode: codeStringSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const listItemsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().nullable().optional(),
  branchId: z.string().uuid().optional(),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;

export const updateMinStockSchema = z.object({
  minStock: priceStringSchema,
});

export type UpdateMinStockInput = z.infer<typeof updateMinStockSchema>;
