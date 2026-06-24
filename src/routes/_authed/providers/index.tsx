import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/providers/')({
  component: ProvidersIndexPage,
});

function ProvidersIndexPage() {
  return <div className="p-6">Proveedores — Próximamente (Sprint 2)</div>;
}

export { Route };
