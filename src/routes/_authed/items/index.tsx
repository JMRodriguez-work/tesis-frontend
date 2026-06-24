import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/items/')({
  component: ItemsIndexPage,
});

function ItemsIndexPage() {
  return <div className="p-6">Items — Próximamente (Sprint 1)</div>;
}

export { Route };
