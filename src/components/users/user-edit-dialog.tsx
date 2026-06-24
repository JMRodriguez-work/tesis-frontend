import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type User, useUpdateUser } from '@/api/queries/use-users';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  type UpdateUserFormValues,
  type UpdateUserInput,
  updateUserSchema,
} from '@/lib/schemas/user';

type UserEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

function UserEditDialog({ open, onOpenChange, user }: UserEditDialogProps) {
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: '', email: '', isActive: true },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, isActive: user.isActive });
    }
  }, [user, reset]);

  const onSubmit = (values: UpdateUserFormValues) => {
    if (!user) return;
    const body: UpdateUserInput = {
      name: values.name,
      email: values.email,
      isActive: values.isActive,
    };
    updateUser.mutate(
      { id: user.id, body },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado');
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
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-name">Nombre *</Label>
            <Input id="edit-user-name" autoComplete="off" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-email">Email *</Label>
            <Input id="edit-user-email" type="email" autoComplete="off" {...register('email')} />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-user-active"
              checked={Boolean(watch('isActive'))}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-user-active" className="cursor-pointer">
              Activo
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateUser.isPending}>
              {updateUser.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { UserEditDialog };
