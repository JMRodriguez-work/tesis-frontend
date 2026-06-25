import { z } from 'zod';

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, 'Decimal inválido (ej: 10 o 10.5)');

const notesString = z
  .string()
  .trim()
  .max(500, 'Máximo 500 caracteres')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createAdjustmentSchema = z.object({
  itemId: z.string().uuid('Item requerido'),
  warehouseId: z.string().uuid('Depósito requerido'),
  direction: z.enum(['in', 'out'], { message: 'Dirección requerida' }),
  quantity: decimalString,
  notes: notesString,
});

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type CreateAdjustmentFormValues = z.input<typeof createAdjustmentSchema>;

export const transferStockSchema = z
  .object({
    itemId: z.string().uuid('Item requerido'),
    fromWarehouseId: z.string().uuid('Depósito origen requerido'),
    toWarehouseId: z.string().uuid('Depósito destino requerido'),
    quantity: decimalString,
    notes: notesString,
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: 'El depósito origen y destino deben ser distintos',
    path: ['toWarehouseId'],
  });

export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type TransferStockFormValues = z.input<typeof transferStockSchema>;

export const listStockMovementsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']).nullable().default(null),
  itemId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export type ListStockMovementsQuery = z.infer<typeof listStockMovementsQuerySchema>;

export const listItemStockHistoryQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
});

export type ListItemStockHistoryQuery = z.infer<typeof listItemStockHistoryQuerySchema>;

export const listLowStockQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
});

export type ListLowStockQuery = z.infer<typeof listLowStockQuerySchema>;
