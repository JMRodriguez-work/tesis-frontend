import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useBranches } from '@/api/queries/use-branches';
import { type User, useChangeUserRole } from '@/api/queries/use-users';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';
import {
  type ChangeUserRoleFormValues,
  type ChangeUserRoleInput,
  changeUserRoleSchema,
} from '@/lib/schemas/user';

type UserChangeRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

const ROLE_ITEMS: ComboboxItem[] = [
  { label: 'Admin', value: '1' },
  { label: 'Manager', value: '2' },
  { label: 'Employee', value: '3' },
];

const ADMIN_ROLE_ID = 1;
const DEFAULT_ROLE_ID = '3';

function UserChangeRoleDialog({ open, onOpenChange, user }: UserChangeRoleDialogProps) {
  const changeUserRole = useChangeUserRole();
  const { data: branchesData } = useBranches({ limit: 100, isActive: true });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeUserRoleFormValues>({
    resolver: zodResolver(changeUserRoleSchema),
    defaultValues: { roleId: DEFAULT_ROLE_ID, branchId: null },
  });

  useEffect(() => {
    if (user) {
      reset({
        roleId: String(user.roleId ?? DEFAULT_ROLE_ID),
        branchId: user.branchId,
      });
    }
  }, [user, reset]);

  const roleIdStr = watch('roleId');
  const branchId = watch('branchId');
  const isAdmin = Number(roleIdStr) === ADMIN_ROLE_ID;

  useEffect(() => {
    if (isAdmin && branchId !== null) {
      setValue('branchId', null, { shouldValidate: true });
    }
  }, [isAdmin, branchId, setValue]);

  const branchItems: ComboboxItem[] = [
    { label: '— Seleccionar sucursal —', value: null },
    ...(branchesData?.data.map((b) => ({ label: b.name, value: b.id })) ?? []),
  ];

  const onSubmit = (values: ChangeUserRoleFormValues) => {
    if (!user) return;
    const roleId = Number(values.roleId);
    const input: ChangeUserRoleInput = {
      roleId,
      ...(roleId === ADMIN_ROLE_ID
        ? { branchId: null }
        : values.branchId
          ? { branchId: values.branchId }
          : { branchId: null }),
    };
    changeUserRole.mutate(
      { id: user.id, body: input },
      {
        onSuccess: () => {
          toast.success('Rol actualizado');
          onOpenChange(false);
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
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>{user ? `${user.name} · ${user.email}` : ''}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <ComboboxField
              id="change-role-select"
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
                id="change-role-branch"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || changeUserRole.isPending}>
              {changeUserRole.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { UserChangeRoleDialog };
