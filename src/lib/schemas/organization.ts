import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
