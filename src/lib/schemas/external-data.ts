import { z } from 'zod';

export const externalDataSourceTypeSchema = z.enum([
  'wholesale_prices',
  'search_trends',
  'seasonality',
]);

export type ExternalDataSourceType = z.infer<typeof externalDataSourceTypeSchema>;

const authConfigShape = z
  .object({
    headers: z.record(z.string(), z.string()).optional(),
    queryParams: z.record(z.string(), z.string()).optional(),
  })
  .strict();

const authConfigTextarea = z.string().transform((val, ctx) => {
  if (val.trim() === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(val);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'JSON malformado' });
    return z.NEVER;
  }
  const result = authConfigShape.safeParse(parsed);
  if (!result.success) {
    ctx.addIssue({
      code: 'custom',
      message: 'JSON inválido (esperado { headers?, queryParams? })',
    });
    return z.NEVER;
  }
  return result.data;
});

const optionalUrl = z
  .string()
  .trim()
  .max(2000, 'Máximo 2000 caracteres')
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalNullableUrl = z
  .string()
  .trim()
  .max(2000, 'Máximo 2000 caracteres')
  .url('URL inválida')
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null));

export const createExternalDataSourceSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
  type: externalDataSourceTypeSchema,
  url: optionalUrl,
  authConfigJson: authConfigTextarea.optional(),
  isActive: z.boolean().default(true),
});

export type CreateExternalDataSourceInput = z.infer<typeof createExternalDataSourceSchema>;
export type CreateExternalDataSourceFormValues = z.input<typeof createExternalDataSourceSchema>;

export const updateExternalDataSourceSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(100).optional(),
  type: externalDataSourceTypeSchema.optional(),
  url: optionalNullableUrl,
  authConfigJson: authConfigTextarea.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExternalDataSourceInput = z.infer<typeof updateExternalDataSourceSchema>;
export type UpdateExternalDataSourceFormValues = z.input<typeof updateExternalDataSourceSchema>;

export const listExternalDataSourcesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  isActive: z.boolean().nullable().default(null),
  type: externalDataSourceTypeSchema.nullable().default(null),
});

export type ListExternalDataSourcesQuery = z.infer<typeof listExternalDataSourcesQuerySchema>;
