import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type Category, useCreateCategory } from '@/api/queries/use-item-categories';
import { Button } from '@/components/ui/button';
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
import { type CreateCategoryInput, createCategorySchema } from '@/lib/schemas/category';

type CategoryCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  onCreated?: (category: Category) => void;
};

function CategoryCreateDialog({
  open,
  onOpenChange,
  branchId,
  onCreated,
}: CategoryCreateDialogProps) {
  const createCategory = useCreateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema) as Resolver<CreateCategoryInput>,
    defaultValues: { name: '', description: '', isActive: true },
  });

  const onSubmit = (values: CreateCategoryInput) => {
    createCategory.mutate(
      { body: values, ...(branchId !== undefined ? { branchId } : {}) },
      {
        onSuccess: (category) => {
          toast.success('Categoría creada');
          reset();
          onOpenChange(false);
          onCreated?.(category);
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
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
          id="create-category-form"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Nombre *</Label>
            <Input id="category-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-description">Descripción</Label>
            <Textarea id="category-description" rows={2} {...register('description')} />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-category-form"
              disabled={isSubmitting || createCategory.isPending}
            >
              {createCategory.isPending ? 'Creando…' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryCreateDialog };
