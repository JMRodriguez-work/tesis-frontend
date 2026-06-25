import { useMe } from '@/api/queries/use-auth';
import { useSalesSummary } from '@/api/queries/use-dashboard';
import { SalesSummaryCard } from '@/components/dashboard/sales-summary-card';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';

function SalesSummaryGrid() {
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const { data, isLoading } = useSalesSummary(adminBranchId ? { branchId: adminBranchId } : {}, {
    enabled: role !== 'Admin' || !!currentBranchId,
  });

  const today = data?.today;
  const thisWeek = data?.thisWeek;
  const previousWeek = data?.previousWeek;
  const comparison = data?.comparison;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SalesSummaryCard
        title="Hoy"
        totalSales={today?.totalSales ?? '0'}
        transactionCount={today?.transactionCount ?? 0}
        averageTicket={today?.averageTicket ?? '0'}
        dateLabel={today?.date}
        delta={null}
        isLoading={isLoading}
      />
      <SalesSummaryCard
        title="Esta semana"
        totalSales={thisWeek?.totalSales ?? '0'}
        transactionCount={thisWeek?.transactionCount ?? 0}
        averageTicket={thisWeek?.averageTicket ?? '0'}
        dateLabel={
          thisWeek?.fromDate && thisWeek?.toDate
            ? `${thisWeek.fromDate} → ${thisWeek.toDate}`
            : undefined
        }
        delta={comparison?.totalSalesDelta ?? null}
        isLoading={isLoading}
      />
      <SalesSummaryCard
        title="Semana anterior"
        totalSales={previousWeek?.totalSales ?? '0'}
        transactionCount={previousWeek?.transactionCount ?? 0}
        averageTicket={previousWeek?.averageTicket ?? '0'}
        dateLabel={
          previousWeek?.fromDate && previousWeek?.toDate
            ? `${previousWeek.fromDate} → ${previousWeek.toDate}`
            : undefined
        }
        delta={null}
        isLoading={isLoading}
      />
    </div>
  );
}

export { SalesSummaryGrid };
