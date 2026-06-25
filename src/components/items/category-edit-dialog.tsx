import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { type Category, useUpdateCategory } from '@/api/queries/use-item-categories';
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
import { Textarea } from '@/components/ui/textarea';
import { mapApiError } from '@/lib/api-error';
import { type UpdateCategoryInput, updateCategorySchema } from '@/lib/schemas/category';

type CategoryEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
};

function CategoryEditDialog({ open, onOpenChange, category }: CategoryEditDialogProps) {
  const updateCategory = useUpdateCategory();

  type FormValues = z.input<typeof updateCategorySchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: { name: '', description: '', isActive: true } as FormValues,
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  const onSubmit = (values: UpdateCategoryInput) => {
    if (!category) return;
    const body: UpdateCategoryInput = {
      name: values.name,
      ...(values.description !== '' ? { description: values.description } : { description: null }),
      isActive: values.isActive,
    };
    updateCategory.mutate(
      { id: category.id, body },
      {
        onSuccess: () => {
          toast.success('Categoría actualizada');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  const isActive = watch('isActive');

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
          <DialogTitle>Editar categoría</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
          id="edit-category-form"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-category-name">Nombre *</Label>
            <Input id="edit-category-name" autoComplete="off" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-category-description">Descripción</Label>
            <Textarea id="edit-category-description" rows={2} {...register('description')} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-category-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-category-active" className="cursor-pointer">
              Activa
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-category-form"
              disabled={isSubmitting || updateCategory.isPending}
            >
              {updateCategory.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryEditDialog };
