import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useBranches } from '@/api/queries/use-branches';
import { type User, useCreateUser } from '@/api/queries/use-users';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import {
  type CreateUserFormValues,
  type CreateUserInput,
  createUserSchema,
} from '@/lib/schemas/user';

type UserCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (user: User) => void;
};

const ROLE_ITEMS: ComboboxItem[] = [
  { label: 'Admin', value: '1' },
  { label: 'Manager', value: '2' },
  { label: 'Employee', value: '3' },
];

const ADMIN_ROLE_ID = 1;
const DEFAULT_ROLE_ID = '3';

function UserCreateDialog({ open, onOpenChange, onCreated }: UserCreateDialogProps) {
  const createUser = useCreateUser();
  const { data: branchesData } = useBranches({ limit: 100, isActive: true });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      roleId: DEFAULT_ROLE_ID,
      branchId: null,
      isActive: true,
    },
  });

  const roleIdStr = watch('roleId');
  const isAdmin = Number(roleIdStr) === ADMIN_ROLE_ID;
  const branchId = watch('branchId');

  useEffect(() => {
    if (isAdmin && branchId !== null) {
      setValue('branchId', null, { shouldValidate: true });
    }
  }, [isAdmin, branchId, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        email: '',
        password: '',
        name: '',
        roleId: DEFAULT_ROLE_ID,
        branchId: null,
        isActive: true,
      });
    }
  }, [open, reset]);

  const branchItems: ComboboxItem[] = [
    { label: '— Seleccionar sucursal —', value: null },
    ...(branchesData?.data.map((b) => ({ label: b.name, value: b.id })) ?? []),
  ];

  const onSubmit = (values: CreateUserFormValues) => {
    const roleId = Number(values.roleId);
    const input: CreateUserInput = {
      email: values.email,
      password: values.password,
      name: values.name,
      roleId,
      ...(roleId === ADMIN_ROLE_ID
        ? { branchId: null }
        : values.branchId
          ? { branchId: values.branchId }
          : {}),
      isActive: values.isActive ?? true,
    };
    createUser.mutate(
      { body: input },
      {
        onSuccess: (user) => {
          toast.success('Usuario creado');
          onOpenChange(false);
          onCreated?.(user);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Nombre *</Label>
            <Input id="user-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">Email *</Label>
            <Input id="user-email" type="email" autoComplete="off" {...register('email')} />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">Contraseña *</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ComboboxField
              id="user-role"
              label="Rol"
              items={ROLE_ITEMS}
              value={roleIdStr == null ? null : String(roleIdStr)}
              onValueChange={(v) =>
                setValue('roleId', v ?? DEFAULT_ROLE_ID, { shouldValidate: true })
              }
              placeholder="Seleccionar rol"
            />
            {!isAdmin ? (
              <ComboboxField
                id="user-branch"
                label="Sucursal"
                items={branchItems}
                value={branchId ?? null}
                onValueChange={(v) => setValue('branchId', v, { shouldValidate: true })}
                placeholder="Seleccionar sucursal"
              />
            ) : null}
          </div>
          {errors.branchId ? (
            <p className="text-xs text-destructive">{errors.branchId.message}</p>
          ) : null}
          {errors.roleId ? (
            <p className="text-xs text-destructive">{errors.roleId.message}</p>
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="user-active"
              checked={Boolean(watch('isActive'))}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="user-active" className="cursor-pointer">
              Activo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createUser.isPending}>
              {createUser.isPending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { UserCreateDialog };
