import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/notifications/')({
  component: NotificationsIndexPage,
});

function NotificationsIndexPage() {
  return <div className="p-6">Notificaciones — Próximamente (Sprint 3)</div>;
}

export { Route };
