import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useUpdateMinStock } from '@/api/queries/use-items';
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
import { mapApiError } from '@/lib/api-error';
import { type UpdateMinStockInput, updateMinStockSchema } from '@/lib/schemas/item';

type EditMinStockDialogProps = {
  itemId: string;
  current: string;
  onClose: () => void;
  onSaved: () => void;
};

function EditMinStockDialog({ itemId, current, onClose, onSaved }: EditMinStockDialogProps) {
  const updateMinStock = useUpdateMinStock();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMinStockInput>({
    resolver: zodResolver(updateMinStockSchema),
    defaultValues: { minStock: current },
  });

  const onSubmit = (values: UpdateMinStockInput) => {
    updateMinStock.mutate(
      { id: itemId, body: values },
      {
        onSuccess: () => {
          toast.success('Mínimo actualizado');
          onSaved();
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar stock mínimo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minStock">Stock mínimo</Label>
            <Input
              id="minStock"
              inputMode="decimal"
              placeholder="0.000"
              {...register('minStock')}
            />
            {errors.minStock ? (
              <p className="text-xs text-destructive">{errors.minStock.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMinStock.isPending}>
              {updateMinStock.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { EditMinStockDialog };
