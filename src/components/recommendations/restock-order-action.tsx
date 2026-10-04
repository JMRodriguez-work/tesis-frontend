import { TruckIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useItemStock } from '@/api/queries/use-items';
import { Button } from '@/components/ui/button';
import { formatQuantity } from '@/lib/format';

type RestockOrderActionProps = {
  type: string;
  itemId: string | null;
  disabled?: boolean;
  onApply: () => void;
};

function RestockOrderAction({ type, itemId, disabled, onApply }: RestockOrderActionProps) {
  const navigate = useNavigate();
  const isRestock = type === 'restock' && itemId !== null;
  const { data: stockRows, isLoading } = useItemStock(isRestock ? itemId : '');

  if (!isRestock) return null;

  const criticalRow = stockRows
    ?.filter((row) => row.status !== 'ok')
    .sort((a, b) => (a.status === 'out' ? -1 : 1) - (b.status === 'out' ? -1 : 1))[0];

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Buscando el stock del item…</p>;
  }
  if (!criticalRow) return null;

  const deficit = Math.max(0, Number(criticalRow.minStock) - Number(criticalRow.quantity));
  const quantityToOrder = deficit > 0 ? deficit : Number(criticalRow.minStock);

  const handleCreateOrder = () => {
    onApply();
    void navigate({
      to: '/provider-orders/new',
      search: {
        itemId: itemId ?? undefined,
        quantity: quantityToOrder.toString(),
      },
    }).catch((err) => console.error('[RestockOrderAction] navigate falló:', err));
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">
        Stock:{' '}
        <span className="font-mono font-medium text-foreground">
          {formatQuantity(criticalRow.quantity, criticalRow.unitType)}
        </span>{' '}
        · Mínimo:{' '}
        <span className="font-mono">
          {formatQuantity(criticalRow.minStock, criticalRow.unitType)}
        </span>{' '}
        · {criticalRow.warehouseName}
      </p>
      <Button size="sm" onClick={handleCreateOrder} disabled={disabled}>
        <TruckIcon className="size-4" />
        Crear orden a proveedor ({formatQuantity(quantityToOrder, criticalRow.unitType)})
      </Button>
      <p className="text-xs text-muted-foreground">
        Al recibir la orden, el stock sube y esta recomendación se cierra sola.
      </p>
    </div>
  );
}

export { RestockOrderAction };
