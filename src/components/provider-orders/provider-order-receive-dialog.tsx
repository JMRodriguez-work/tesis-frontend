import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useReceiveProviderOrder } from '@/api/queries/use-provider-orders';
import { useWarehouses } from '@/api/queries/use-warehouses';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';

type ProviderOrderReceiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  branchId: string | null;
};

function ProviderOrderReceiveDialog({
  open,
  onOpenChange,
  orderId,
  branchId,
}: ProviderOrderReceiveDialogProps) {
  const receiveOrder = useReceiveProviderOrder();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const filteredWarehouses = useMemo(() => {
    if (!warehousesData?.data || !branchId) return [];
    return warehousesData.data.filter((w) => w.branches.some((b) => b.id === branchId));
  }, [warehousesData, branchId]);

  const warehouseItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Seleccionar depósito —', value: null },
      ...filteredWarehouses.map((w) => ({ label: w.name, value: w.id })),
    ],
    [filteredWarehouses],
  );

  const reset = () => setSelectedWarehouse(null);

  const onConfirm = () => {
    if (!orderId || !selectedWarehouse) return;
    receiveOrder.mutate(
      { id: orderId, body: { warehouseId: selectedWarehouse } },
      {
        onSuccess: () => {
          toast.success('Orden recibida');
          reset();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recibir orden</DialogTitle>
          <DialogDescription>
            Seleccioná el depósito donde se va a recibir la mercadería. El stock de los items se
            actualizará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {isLoadingWarehouses ? (
            <p className="text-xs text-muted-foreground">Cargando depósitos…</p>
          ) : filteredWarehouses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay depósitos disponibles para esta sucursal.
            </p>
          ) : (
            <ComboboxField
              id="receive-warehouse"
              label="Depósito destino"
              items={warehouseItems}
              value={selectedWarehouse}
              onValueChange={(value) => setSelectedWarehouse(value)}
              placeholder="Seleccionar depósito"
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!selectedWarehouse || receiveOrder.isPending}
          >
            {receiveOrder.isPending ? 'Recibiendo…' : 'Recibir orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderOrderReceiveDialog };
