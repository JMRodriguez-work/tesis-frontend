import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/warehouses/')({
  component: WarehousesIndexPage,
});

function WarehousesIndexPage() {
  return <div className="p-6">Depósitos — Próximamente (Sprint 1)</div>;
}

export { Route };
