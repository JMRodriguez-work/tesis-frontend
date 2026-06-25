import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { type Category, useDeleteCategory } from '@/api/queries/use-item-categories';
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

type CategoryDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
};

function CategoryDeleteDialog({ open, onOpenChange, category }: CategoryDeleteDialogProps) {
  const deleteCategory = useDeleteCategory();

  const confirmSchema = useMemo(
    () =>
      z.object({
        confirmName: z.string().refine((val) => val === category?.name, {
          message: 'El nombre no coincide',
        }),
      }),
    [category?.name],
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
    if (!category) return;
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success('Categoría eliminada');
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
          <DialogTitle>Eliminar categoría</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si la categoría tiene items activos asociados, la
            operación fallará.
            <br />
            Para confirmar, escribí el nombre exacto de la categoría:{' '}
            <strong>{category?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          id="delete-category-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-category-confirm">Nombre de la categoría</Label>
            <Input id="delete-category-confirm" autoComplete="off" {...register('confirmName')} />
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
              form="delete-category-form"
              variant="destructive"
              disabled={isSubmitting || deleteCategory.isPending}
            >
              {deleteCategory.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryDeleteDialog };
