import { toast } from 'sonner';
import { useCancelProviderOrder } from '@/api/queries/use-provider-orders';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';

type ProviderOrderCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
};

function ProviderOrderCancelDialog({
  open,
  onOpenChange,
  orderId,
}: ProviderOrderCancelDialogProps) {
  const cancelOrder = useCancelProviderOrder();

  const onConfirm = () => {
    if (!orderId) return;
    cancelOrder.mutate(orderId, {
      onSuccess: () => {
        toast.success('Orden cancelada');
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
          <DialogTitle>Cancelar orden</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          ¿Cancelar esta orden? La orden se marcará como cancelada. Esta acción no se puede deshacer
          y solo funciona si la orden está pendiente.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            No cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelOrder.isPending}
          >
            {cancelOrder.isPending ? 'Cancelando…' : 'Cancelar orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderOrderCancelDialog };
