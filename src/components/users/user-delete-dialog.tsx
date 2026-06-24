import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { type User, useDeleteUser } from '@/api/queries/use-users';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';

type UserDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

function UserDeleteDialog({ open, onOpenChange, user }: UserDeleteDialogProps) {
  const deleteUser = useDeleteUser();

  const confirmSchema = useMemo(
    () =>
      z.object({
        confirmEmail: z.string().refine((val) => val === user?.email, {
          message: 'El email no coincide',
        }),
      }),
    [user?.email],
  );

  type FormValues = z.infer<typeof confirmSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirmEmail: '' },
  });

  useEffect(() => {
    if (open) reset({ confirmEmail: '' });
  }, [open, reset]);

  const onSubmit = () => {
    if (!user) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('Usuario eliminado');
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset({ confirmEmail: '' });
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El usuario será marcado como inactivo. Si es el último
            administrador activo de la organización, la operación fallará.
            <br />
            Para confirmar, escribí el email exacto del usuario: <strong>{user?.email}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          id="delete-user-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-user-confirm">Email del usuario</Label>
            <Input
              id="delete-user-confirm"
              type="email"
              autoComplete="off"
              {...register('confirmEmail')}
            />
            {errors.confirmEmail ? (
              <p className="text-xs text-destructive">{errors.confirmEmail.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="delete-user-form"
              variant="destructive"
              disabled={isSubmitting || deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { UserDeleteDialog };
