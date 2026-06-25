import { ArrowRightIcon, UsersIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import type { InactiveCustomer } from '@/api/queries/use-dashboard';
import { EmptyState } from '@/components/feedback/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatDecimal } from '@/lib/format';

type InactiveCustomersCardProps = {
  customers: InactiveCustomer[];
  total: number;
};

function InactiveCustomersCard({ customers, total }: InactiveCustomersCardProps) {
  if (customers.length === 0) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Clientes inactivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Sin alertas"
            description="No hay clientes inactivos con recomendaciones pendientes."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Clientes inactivos
            <span className="text-xs font-normal text-muted-foreground">
              ({formatDecimal(total)})
            </span>
          </CardTitle>
          <Link
            to="/recommendations"
            search={{ type: 'retention', status: 'pending' }}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Ver todos
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {customers.map((c) => {
            const days = c.daysSinceLastPurchase;
            return (
              <li key={c.customerId} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 flex-col">
                  <Link
                    to="/customers/$customerId"
                    params={{ customerId: c.customerId }}
                    className="truncate text-xs font-medium text-foreground hover:underline"
                  >
                    {c.customerFullname}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    Última compra: {formatDate(c.lastPurchaseAt)} · {formatDecimal(c.purchaseCount)}{' '}
                    compras · {formatCurrency(c.totalSpent)}
                  </span>
                </div>
                <span
                  className={
                    days !== null && days > 90
                      ? 'shrink-0 text-xs font-semibold text-destructive tabular-nums'
                      : 'shrink-0 text-xs font-medium tabular-nums text-foreground'
                  }
                >
                  {days !== null ? `${formatDecimal(days)} d` : '—'}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export type { InactiveCustomersCardProps };
export { InactiveCustomersCard };
