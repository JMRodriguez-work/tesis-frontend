import { useItemStock } from '@/api/queries/use-items';
import { formatQuantity } from '@/lib/format';
import { cn } from '@/lib/utils';

type SaleItemStockHintProps = {
  itemId: string;
  warehouseId: string;
  quantity: string;
};

function SaleItemStockHint({ itemId, warehouseId, quantity }: SaleItemStockHintProps) {
  const { data: stockRows, isLoading, error } = useItemStock(itemId);

  if (!itemId || isLoading || error) return null;

  const row = stockRows?.find((s) => s.warehouseId === warehouseId);
  if (!row) return null;

  const requested = Number(quantity);
  const available = Number(row.quantity);
  const exceeds = !Number.isNaN(requested) && requested > available;

  const chipColor =
    row.status === 'out'
      ? 'border-red-200 bg-red-50 text-red-700'
      : row.status === 'low'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-none border px-1.5 py-0.5 font-mono text-[11px]',
          chipColor,
        )}
      >
        Stock: {formatQuantity(row.quantity, row.unitType)}
      </span>
      {exceeds ? (
        <span className="text-[11px] text-destructive">
          Supera el stock disponible en este depósito
        </span>
      ) : null}
    </div>
  );
}

export { SaleItemStockHint };
