import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useDeleteWarehouse, type Warehouse } from '@/api/queries/use-warehouses';
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

type WarehouseDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
};

function WarehouseDeleteDialog({ open, onOpenChange, warehouse }: WarehouseDeleteDialogProps) {
  const deleteWarehouse = useDeleteWarehouse();

  const confirmSchema = useMemo(
    () =>
      z.object({
        confirmName: z.string().refine((val) => val === warehouse?.name, {
          message: 'El nombre no coincide',
        }),
      }),
    [warehouse?.name],
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
    if (!warehouse) return;
    deleteWarehouse.mutate(warehouse.id, {
      onSuccess: () => {
        toast.success('Depósito eliminado');
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
          <DialogTitle>Eliminar depósito</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si el depósito tiene items con stock mayor a cero, la
            operación fallará.
            <br />
            Para confirmar, escribí el nombre exacto del depósito:{' '}
            <strong>{warehouse?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          id="delete-warehouse-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-warehouse-confirm">Nombre del depósito</Label>
            <Input id="delete-warehouse-confirm" autoComplete="off" {...register('confirmName')} />
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
              form="delete-warehouse-form"
              variant="destructive"
              disabled={isSubmitting || deleteWarehouse.isPending}
            >
              {deleteWarehouse.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { WarehouseDeleteDialog };
