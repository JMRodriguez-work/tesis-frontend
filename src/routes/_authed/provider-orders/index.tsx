import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/provider-orders/')({
  component: ProviderOrdersIndexPage,
});

function ProviderOrdersIndexPage() {
  return <div className="p-6">Órdenes a proveedores — Próximamente (Sprint 2)</div>;
}

export { Route };
