import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/stock-movements/adjustment')({
  component: StockAdjustmentPage,
});

function StockAdjustmentPage() {
  return <div className="p-6">Ajuste de stock — Próximamente (Sprint 2)</div>;
}

export { Route };
