import { toast } from 'sonner';
import { type Customer, useDeleteCustomer } from '@/api/queries/use-customers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';

type CustomerDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
};

function CustomerDeleteDialog({ open, onOpenChange, customer }: CustomerDeleteDialogProps) {
  const deleteCustomer = useDeleteCustomer();

  const onConfirm = () => {
    if (!customer) return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => {
        toast.success('Cliente eliminado');
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
          <DialogTitle>Eliminar cliente</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          ¿Eliminar a <strong>{customer?.fullname}</strong>? El cliente se marcará como inactivo. Si
          tiene ventas activas, la operación fallará.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteCustomer.isPending}
          >
            {deleteCustomer.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CustomerDeleteDialog };
