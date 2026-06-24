import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/404')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return <div className="p-6">404 — No encontrado</div>;
}

export { Route };
