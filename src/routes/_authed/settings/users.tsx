import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/settings/users')({
  component: UsersPage,
});

function UsersPage() {
  return <div className="p-6">Usuarios — Próximamente (Sprint 1)</div>;
}

export { Route };
