import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useUpdateWarehouse, type Warehouse } from '@/api/queries/use-warehouses';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { mapApiError } from '@/lib/api-error';
import {
  type UpdateWarehouseFormValues,
  type UpdateWarehouseInput,
  updateWarehouseSchema,
} from '@/lib/schemas/warehouse';

type WarehouseEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
};

function WarehouseEditDialog({ open, onOpenChange, warehouse }: WarehouseEditDialogProps) {
  const updateWarehouse = useUpdateWarehouse();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateWarehouseFormValues>({
    resolver: zodResolver(updateWarehouseSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name,
        description: warehouse.description ?? '',
        isActive: warehouse.isActive,
      });
    }
  }, [warehouse, reset]);

  const isActive = watch('isActive');

  const onSubmit = (values: UpdateWarehouseFormValues) => {
    if (!warehouse) return;
    const body: UpdateWarehouseInput = {
      name: values.name,
      description: values.description === '' ? null : (values.description ?? undefined),
      isActive: values.isActive,
    };
    updateWarehouse.mutate(
      { id: warehouse.id, body },
      {
        onSuccess: () => {
          toast.success('Depósito actualizado');
          onOpenChange(false);
        },
        onError: (err) => toast.error(mapApiError(err).message),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar depósito</DialogTitle>
          <DialogDescription>
            Las sucursales asignadas se gestionan desde el botón "Sucursales" en la tabla.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-warehouse-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-warehouse-name">Nombre *</Label>
            <Input id="edit-warehouse-name" autoComplete="off" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-warehouse-description">Descripción</Label>
            <Textarea
              id="edit-warehouse-description"
              autoComplete="off"
              rows={3}
              {...register('description')}
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-warehouse-active"
              checked={Boolean(isActive)}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-warehouse-active" className="cursor-pointer">
              Activo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-warehouse-form"
              disabled={isSubmitting || updateWarehouse.isPending}
            >
              {updateWarehouse.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { WarehouseEditDialog };
