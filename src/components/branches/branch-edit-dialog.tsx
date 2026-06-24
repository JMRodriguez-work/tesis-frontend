import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type BranchItem, useUpdateBranch } from '@/api/queries/use-branches';
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
import { type UpdateBranchInput, updateBranchSchema } from '@/lib/schemas/branch';

type BranchEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchItem | null;
};

function BranchEditDialog({ open, onOpenChange, branch }: BranchEditDialogProps) {
  const updateBranch = useUpdateBranch();

  type FormValues = {
    name: string;
    isActive: boolean;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateBranchSchema) as Resolver<FormValues>,
    defaultValues: { name: '', isActive: true },
  });

  useEffect(() => {
    if (branch) {
      reset({ name: branch.name, isActive: branch.isActive });
    }
  }, [branch, reset]);

  const onSubmit = (values: FormValues) => {
    if (!branch) return;
    const body: UpdateBranchInput = {
      name: values.name,
      isActive: values.isActive,
    };
    updateBranch.mutate(
      { id: branch.id, body },
      {
        onSuccess: () => {
          toast.success('Sucursal actualizada');
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
          <DialogTitle>Editar sucursal</DialogTitle>
        </DialogHeader>
        <form
          id="edit-branch-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-branch-name">Nombre *</Label>
            <Input id="edit-branch-name" autoComplete="off" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-branch-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-branch-active" className="cursor-pointer">
              Activa
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-branch-form"
              disabled={isSubmitting || updateBranch.isPending}
            >
              {updateBranch.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BranchEditDialog };
