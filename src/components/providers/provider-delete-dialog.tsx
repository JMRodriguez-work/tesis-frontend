import { toast } from 'sonner';
import { type Provider, useDeleteProvider } from '@/api/queries/use-providers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';

type ProviderDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider | null;
};

function ProviderDeleteDialog({ open, onOpenChange, provider }: ProviderDeleteDialogProps) {
  const deleteProvider = useDeleteProvider();

  const onConfirm = () => {
    if (!provider) return;
    deleteProvider.mutate(provider.id, {
      onSuccess: () => {
        toast.success('Proveedor eliminado');
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
          <DialogTitle>Eliminar proveedor</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          ¿Eliminar a <strong>{provider?.name}</strong>? El proveedor se marcará como inactivo. Si
          tiene órdenes activas, la operación fallará.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteProvider.isPending}
          >
            {deleteProvider.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderDeleteDialog };
