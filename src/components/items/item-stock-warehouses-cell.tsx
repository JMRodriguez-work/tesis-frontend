import { CaretDownIcon, WarehouseIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import type { ItemWithStockRow } from '@/api/queries/use-items';
import { StockStatusBadge } from '@/components/stock/stock-status-badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatQuantity } from '@/lib/format';

type ItemStockWarehousesCellProps = {
  warehouses: ItemWithStockRow['warehouses'];
  unitType?: 'count' | 'weight' | 'volume' | null;
};

function ItemStockWarehousesCell({ warehouses, unitType }: ItemStockWarehousesCellProps) {
  if (warehouses.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin depósitos asignados</span>;
  }
  if (warehouses.length === 1) {
    const w = warehouses[0]!;
    return (
      <div className="flex items-center gap-2">
        <WarehouseIcon className="size-3.5 text-muted-foreground" />
        <span className="truncate text-sm">{w.warehouseName}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="font-mono text-xs">{formatQuantity(w.quantity, unitType ?? null)}</span>
        <StockStatusBadge status={w.status} />
      </div>
    );
  }
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 gap-2 px-2">
            <WarehouseIcon className="size-3.5" />
            <span className="font-medium">{warehouses.length} depósitos</span>
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {warehouses.map((w) => (
                <span
                  key={w.warehouseId}
                  className="inline-block size-1.5 rounded-full"
                  data-status={w.status}
                  style={{
                    backgroundColor:
                      w.status === 'out'
                        ? 'var(--color-destructive)'
                        : w.status === 'low'
                          ? 'var(--color-muted-foreground)'
                          : 'var(--color-primary)',
                  }}
                />
              ))}
            </div>
            <CaretDownIcon className="size-3" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold">
          Desglose por depósito
        </div>
        <ul className="divide-y divide-border">
          {warehouses.map((w) => (
            <li key={w.warehouseId} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{w.warehouseName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  min {formatQuantity(w.minStock, unitType ?? null)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {formatQuantity(w.quantity, unitType ?? null)}
                </span>
                <StockStatusBadge status={w.status} />
                <Link
                  to="/warehouses/$warehouseId"
                  params={{ warehouseId: w.warehouseId }}
                  className="text-xs text-primary hover:underline"
                >
                  ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export { ItemStockWarehousesCell };
