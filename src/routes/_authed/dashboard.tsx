import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return <div className="p-6">Dashboard — Próximamente (Sprint 3)</div>;
}

export { Route };
