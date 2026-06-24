import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateBranch } from '@/api/queries/use-branches';
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
import { type CreateBranchInput, createBranchSchema } from '@/lib/schemas/branch';

type BranchCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function BranchCreateDialog({ open, onOpenChange }: BranchCreateDialogProps) {
  const createBranch = useCreateBranch();

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
    resolver: zodResolver(createBranchSchema) as Resolver<FormValues>,
    defaultValues: { name: '', isActive: true },
  });

  const onSubmit = (values: FormValues) => {
    const body: CreateBranchInput = {
      name: values.name,
      isActive: values.isActive,
    };
    createBranch.mutate(body, {
      onSuccess: () => {
        toast.success('Sucursal creada');
        reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
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
          <DialogTitle>Nueva sucursal</DialogTitle>
        </DialogHeader>
        <form
          id="create-branch-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-name">Nombre *</Label>
            <Input id="branch-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="branch-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="branch-active" className="cursor-pointer">
              Activa
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-branch-form"
              disabled={isSubmitting || createBranch.isPending}
            >
              {createBranch.isPending ? 'Creando…' : 'Crear sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BranchCreateDialog };
