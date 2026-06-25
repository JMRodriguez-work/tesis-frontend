import { z } from 'zod';

const nullableOptionalShortString = (max: number, label?: string) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres${label ? ` (${label})` : ''}`)
    .optional()
    .or(z.literal('').transform(() => undefined));

const nullableOptionalEmail = z
  .string()
  .trim()
  .email('Email inválido')
  .max(100, 'Máximo 100 caracteres')
  .optional()
  .or(z.literal('').transform(() => undefined));

const nullableOptionalPhone = z
  .string()
  .trim()
  .max(50, 'Máximo 50 caracteres')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createProviderSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  companyName: nullableOptionalShortString(255, 'razón social'),
  contactName: nullableOptionalShortString(100, 'nombre de contacto'),
  contactEmail: nullableOptionalEmail,
  contactPhone: nullableOptionalPhone,
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type CreateProviderFormValues = z.input<typeof createProviderSchema>;

export const updateProviderSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255).optional(),
  companyName: z.string().max(255).nullable().optional(),
  contactName: z.string().max(100).nullable().optional(),
  contactEmail: z.string().email('Email inválido').max(100).nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type UpdateProviderFormValues = z.input<typeof updateProviderSchema>;

export const listProvidersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(''),
  showInactive: z.boolean().default(false),
});

export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>;
