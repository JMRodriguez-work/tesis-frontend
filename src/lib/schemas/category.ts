import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  description: z
    .string()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
