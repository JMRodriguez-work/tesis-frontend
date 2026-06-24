import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/sales/')({
  component: SalesIndexPage,
});

function SalesIndexPage() {
  return <div className="p-6">Ventas — Próximamente (Sprint 2)</div>;
}

export { Route };
