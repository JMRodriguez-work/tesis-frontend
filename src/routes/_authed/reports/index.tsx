import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/reports/')({
  component: ReportsIndexPage,
});

function ReportsIndexPage() {
  return <div className="p-6">Reportes — Próximamente (Sprint 3)</div>;
}

export { Route };
