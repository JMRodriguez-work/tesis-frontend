import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/settings/external-data')({
  component: ExternalDataPage,
});

function ExternalDataPage() {
  return <div className="p-6">Datos externos — Próximamente (Sprint 3)</div>;
}

export { Route };
