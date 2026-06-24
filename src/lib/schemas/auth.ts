import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const onboardingSchema = z.object({
  organizationName: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  branchName: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  warehouseName: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
