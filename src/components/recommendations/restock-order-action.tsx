import { TruckIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useItemOrderSuggestions, useItemStock } from '@/api/queries/use-items';
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
  const { data: suggestions } = useItemOrderSuggestions(isRestock ? itemId : '');

  if (!isRestock) return null;

  const criticalRow = stockRows
    ?.filter((row) => row.status !== 'ok')
    .sort((a, b) => (a.status === 'out' ? -1 : 1) - (b.status === 'out' ? -1 : 1))[0];

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Buscando el stock del item…</p>;
  }
  if (!criticalRow) return null;

  const deficit = Math.max(0, Number(criticalRow.minStock) - Number(criticalRow.quantity));
  const baseQuantity = deficit > 0 ? deficit : Number(criticalRow.minStock);

  // Reponer solo el déficit deja el stock pegado al mínimo: la próxima venta
  // vuelve a disparar la alerta. Sumamos la demanda semanal promedio
  // (últimos 28 días, calculada en el backend) como margen de reposición.
  const weeklyRaw = suggestions?.quantitySuggestion.weeklyDemandUnits ?? null;
  const weekly =
    weeklyRaw === null
      ? 0
      : criticalRow.unitType === 'count'
        ? Math.ceil(weeklyRaw)
        : Math.round(weeklyRaw * 100) / 100;
  const extra = Math.max(0, weekly);
  const quantityToOrder = baseQuantity + extra;

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
      {extra > 0 ? (
        <p className="text-xs text-muted-foreground">
          Sugerido: {formatQuantity(quantityToOrder, criticalRow.unitType)} = déficit (
          {formatQuantity(baseQuantity, criticalRow.unitType)}) + ~
          {formatQuantity(weekly, criticalRow.unitType)} de venta semanal (últimos 28
          días) — para no quedar al límite.
        </p>
      ) : null}
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
