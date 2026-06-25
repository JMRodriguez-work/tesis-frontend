import { z } from 'zod';

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, 'Decimal inválido (ej: 10 o 10.5)');

const costString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Decimal inválido (ej: 100.50)');

export const providerOrderItemSchema = z.object({
  itemId: z.string().uuid('Item inválido'),
  quantity: decimalString,
  cost: costString,
  unitId: z.number().int().positive().optional(),
});

export const createProviderOrderSchema = z.object({
  providerId: z.string().uuid('Proveedor requerido'),
  estimatedDelivery: z
    .string()
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  items: z.array(providerOrderItemSchema).min(1, 'Agregá al menos un item'),
});

export type CreateProviderOrderInput = z.infer<typeof createProviderOrderSchema>;
export type CreateProviderOrderFormValues = z.input<typeof createProviderOrderSchema>;

export const updateProviderOrderSchema = z.object({
  estimatedDelivery: z.string().trim().nullable().optional(),
});

export type UpdateProviderOrderInput = z.infer<typeof updateProviderOrderSchema>;
export type UpdateProviderOrderFormValues = z.input<typeof updateProviderOrderSchema>;

export const receiveProviderOrderSchema = z.object({
  warehouseId: z.string().uuid('Depósito requerido'),
});

export type ReceiveProviderOrderInput = z.infer<typeof receiveProviderOrderSchema>;

export const listProviderOrdersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'received', 'cancelled']).nullable().default(null),
  providerId: z.string().uuid().optional(),
});

export type ListProviderOrdersQuery = z.infer<typeof listProviderOrdersQuerySchema>;
