import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/customers/')({
  component: CustomersIndexPage,
});

function CustomersIndexPage() {
  return <div className="p-6">Clientes — Próximamente (Sprint 1)</div>;
}

export { Route };
