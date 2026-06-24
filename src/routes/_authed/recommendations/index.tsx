import { createFileRoute } from '@tanstack/react-router';

const Route = createFileRoute('/_authed/recommendations/')({
  component: RecommendationsIndexPage,
});

function RecommendationsIndexPage() {
  return <div className="p-6">Recomendaciones — Próximamente (Sprint 3)</div>;
}

export { Route };
