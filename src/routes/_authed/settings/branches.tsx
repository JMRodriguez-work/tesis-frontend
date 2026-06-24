import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/settings/branches')({
  component: BranchesPage,
});

function BranchesPage() {
  return <div className="p-6">Sucursales — Próximamente (Sprint 1)</div>;
}

export { Route };
