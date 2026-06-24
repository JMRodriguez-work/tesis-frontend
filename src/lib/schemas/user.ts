import { z } from 'zod';

const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(255);

const roleIdForm = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    ctx.addIssue({ code: 'custom', message: 'Rol inválido' });
    return z.NEVER;
  }
  return num;
});

export const createUserSchema = z
  .object({
    email: z.string().trim().email('Email inválido'),
    password: passwordSchema,
    name: z.string().trim().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
    roleId: roleIdForm.optional(),
    branchId: z.string().uuid('Sucursal inválida').nullable().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.roleId === 1) return data.branchId === null || data.branchId === undefined;
      return typeof data.branchId === 'string' && data.branchId.length > 0;
    },
    {
      message: 'Admin no puede tener sucursal; Manager/Employee requieren sucursal',
      path: ['branchId'],
    },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateUserFormValues = z.input<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Requerido').max(255).optional(),
    email: z.string().trim().email('Email inválido').optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserFormValues = z.input<typeof updateUserSchema>;

export const changeUserRoleSchema = z
  .object({
    roleId: roleIdForm,
    branchId: z.string().uuid('Sucursal inválida').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.roleId === 1) return data.branchId === null || data.branchId === undefined;
      return typeof data.branchId === 'string' && data.branchId.length > 0;
    },
    {
      message: 'Admin no puede tener sucursal; Manager/Employee requieren sucursal',
      path: ['branchId'],
    },
  );

export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type ChangeUserRoleFormValues = z.input<typeof changeUserRoleSchema>;

export const listUsersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
