import { z } from "zod";

const nullableOptionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const nullableOptionalEmail = z
  .string()
  .trim()
  .email("Email inválido")
  .max(255)
  .optional()
  .or(z.literal("").transform(() => undefined));

const nullableOptionalPhone = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createCustomerSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(255, "Máximo 255 caracteres"),
  email: nullableOptionalEmail,
  phone: nullableOptionalPhone,
  address: nullableOptionalString(500),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCustomerFormValues = z.input<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  fullname: z.string().trim().min(1, "Requerido").max(255).optional(),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255)
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Mínimo 1 carácter")
    .max(50)
    .nullable()
    .optional(),
  address: z.string().max(500, "Máximo 500 caracteres").nullable().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdateCustomerFormValues = z.input<typeof updateCustomerSchema>;

export const listCustomersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  search: z.string().default(""),
  showInactive: z.boolean().default(false),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
