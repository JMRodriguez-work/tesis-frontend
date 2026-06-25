import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCancelSale } from '@/api/queries/use-sales';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mapApiError } from '@/lib/api-error';
import { type CancelSaleInput, cancelSaleSchema } from '@/lib/schemas/sale';

type SaleCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
};

function SaleCancelDialog({ open, onOpenChange, saleId }: SaleCancelDialogProps) {
  const cancelSale = useCancelSale();

  const defaultValues = useMemo<CancelSaleInput>(() => ({ cancellationReason: '' }), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CancelSaleInput>({
    resolver: zodResolver(cancelSaleSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) reset({ cancellationReason: '' });
  }, [open, reset]);

  const onSubmit = (values: CancelSaleInput) => {
    if (!saleId) return;
    cancelSale.mutate(
      { id: saleId, body: values },
      {
        onSuccess: () => {
          toast.success('Venta cancelada');
          onOpenChange(false);
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar venta</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El stock de los items volverá al estado anterior y se
            registrará un movimiento compensatorio. Indicá el motivo de la cancelación.
          </DialogDescription>
        </DialogHeader>
        <form
          id="cancel-sale-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancellationReason">Motivo (3-500 caracteres)</Label>
            <Textarea
              id="cancellationReason"
              placeholder="Ej: Error en la carga de items"
              rows={3}
              autoComplete="off"
              {...register('cancellationReason')}
            />
            {errors.cancellationReason ? (
              <p className="text-xs text-destructive">{errors.cancellationReason.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cancel-sale-form"
              variant="destructive"
              disabled={isSubmitting || cancelSale.isPending}
            >
              {cancelSale.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SaleCancelDialog };
