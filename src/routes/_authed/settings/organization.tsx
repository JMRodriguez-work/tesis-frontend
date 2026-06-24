import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/settings/organization')({
  component: OrganizationPage,
});

function OrganizationPage() {
  return <div className="p-6">Organización — Próximamente (Sprint 1)</div>;
}

export { Route };
