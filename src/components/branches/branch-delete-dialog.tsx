import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { type BranchItem, useDeleteBranch } from '@/api/queries/use-branches';
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

type BranchDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchItem | null;
};

function BranchDeleteDialog({ open, onOpenChange, branch }: BranchDeleteDialogProps) {
  const deleteBranch = useDeleteBranch();

  const confirmSchema = useMemo(
    () =>
      z.object({
        confirmName: z.string().refine((val) => val === branch?.name, {
          message: 'El nombre no coincide',
        }),
      }),
    [branch?.name],
  );

  type FormValues = z.infer<typeof confirmSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirmName: '' },
  });

  useEffect(() => {
    if (open) reset({ confirmName: '' });
  }, [open, reset]);

  const onSubmit = () => {
    if (!branch) return;
    deleteBranch.mutate(branch.id, {
      onSuccess: () => {
        toast.success('Sucursal eliminada');
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
        if (!next) reset({ confirmName: '' });
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar sucursal</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si la sucursal es la única activa de la organización o
            tiene usuarios activos, la operación fallará.
            <br />
            Para confirmar, escribí el nombre exacto de la sucursal: <strong>{branch?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          id="delete-branch-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-branch-confirm">Nombre de la sucursal</Label>
            <Input id="delete-branch-confirm" autoComplete="off" {...register('confirmName')} />
            {errors.confirmName ? (
              <p className="text-xs text-destructive">{errors.confirmName.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="delete-branch-form"
              variant="destructive"
              disabled={isSubmitting || deleteBranch.isPending}
            >
              {deleteBranch.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BranchDeleteDialog };
