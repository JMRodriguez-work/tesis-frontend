import { z } from 'zod';

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, 'Decimal inválido (ej: 10 o 10.5)');

const priceString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido (ej: 100 o 100.50)');

const saleItemSchema = z.object({
  itemId: z.string().uuid('Item requerido'),
  warehouseId: z.string().uuid('Depósito requerido'),
  quantity: decimalString,
  price: priceString,
  unitId: z.number().int().positive().optional(),
});

export const createSaleSchema = z.object({
  customerId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  discountPercent: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (v === undefined || v === '') return true;
        if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return false;
        const n = Number(v);
        return n >= 0 && n <= 100;
      },
      { message: 'Descuento inválido (0-100)' },
    )
    .or(z.literal('').transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  items: z.array(saleItemSchema).min(1, 'Agregá al menos un item'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleFormValues = z.input<typeof createSaleSchema>;
export type SaleItemFormValues = z.input<typeof saleItemSchema>;

export const cancelSaleSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(500, 'Máximo 500 caracteres'),
});

export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

export const listSalesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  includeCancelled: z.boolean().nullable().default(null),
  customerId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
