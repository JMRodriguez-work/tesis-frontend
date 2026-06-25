import { toast } from 'sonner';
import { useDeleteProviderOrder } from '@/api/queries/use-provider-orders';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';

type ProviderOrderDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
};

function ProviderOrderDeleteDialog({
  open,
  onOpenChange,
  orderId,
}: ProviderOrderDeleteDialogProps) {
  const deleteOrder = useDeleteProviderOrder();

  const onConfirm = () => {
    if (!orderId) return;
    deleteOrder.mutate(orderId, {
      onSuccess: () => {
        toast.success('Orden eliminada');
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar orden</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          ¿Eliminar esta orden? Se marcará como cancelada. Si la orden ya fue recibida, la operación
          fallará.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteOrder.isPending}
          >
            {deleteOrder.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderOrderDeleteDialog };
