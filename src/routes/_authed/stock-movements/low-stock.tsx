import { ArrowLeftIcon, PencilSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMe } from '@/api/queries/use-auth';
import { useLowStockItems } from '@/api/queries/use-stock-movements';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { formatDecimal } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/stock-movements/low-stock')({
  component: LowStockPage,
});

function LowStockPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const {
    data: lowStock,
    isLoading,
    error,
  } = useLowStockItems(
    { branchId: adminBranchId },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/stock-movements"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <WarningIcon className="size-5 text-amber-500" weight="fill" />
              Stock bajo mínimo
            </h1>
            {lowStock ? (
              <p className="text-xs text-muted-foreground">
                {lowStock.length} {lowStock.length === 1 ? 'item bajo mínimo' : 'items bajo mínimo'}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {showBranchWarning ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-700">
          Seleccioná una sucursal activa en el selector del topbar para ver el stock bajo mínimo.
        </div>
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          No se pudo cargar el stock bajo mínimo.
        </div>
      ) : !lowStock || lowStock.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
          Todo el stock está sobre el mínimo configurado. No hay alertas pendientes.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 font-medium">Depósito</th>
                <th className="p-3 font-medium text-right">Cantidad</th>
                <th className="p-3 font-medium text-right">Mínimo</th>
                <th className="p-3 font-medium text-right">Déficit</th>
                {canWrite ? <th className="p-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {lowStock.map((row) => (
                <tr key={`${row.itemId}-${row.warehouseId}`} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: row.itemId }}
                      className="font-medium text-foreground hover:underline"
                    >
                      {row.itemName}
                    </Link>
                    {row.itemCode ? (
                      <span className="ml-1 text-muted-foreground">({row.itemCode})</span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <Link
                      to="/warehouses/$warehouseId"
                      params={{ warehouseId: row.warehouseId }}
                      className="text-foreground hover:underline"
                    >
                      {row.warehouseName}
                    </Link>
                  </td>
                  <td className="p-3 text-right font-mono">{formatDecimal(row.quantity)}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {formatDecimal(row.minStock)}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-red-600">
                    −{formatDecimal(row.deficit)}
                  </td>
                  {canWrite ? (
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void navigate({
                            to: '/stock-movements/new-adjustment',
                            search: { itemId: row.itemId, warehouseId: row.warehouseId },
                          })
                        }
                      >
                        <PencilSimpleIcon className="size-3.5" />
                        Ajustar
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { Route };
