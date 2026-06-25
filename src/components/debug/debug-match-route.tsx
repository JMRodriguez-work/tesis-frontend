import { useMatchRoute } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';

function DebugMatchRoute({ current }: { current: string }) {
  const matchRoute = useMatchRoute();
  const tests = [
    { to: '/settings/branches', fuzzy: true, label: 'branches fuzzy:true' },
    { to: '/settings/branches', fuzzy: false, label: 'branches fuzzy:false' },
    { to: '/settings/users', fuzzy: true, label: 'users fuzzy:true' },
    { to: '/settings/users', fuzzy: false, label: 'users fuzzy:false' },
    { to: '/settings/categories', fuzzy: true, label: 'categories fuzzy:true' },
    { to: '/settings/organization', fuzzy: true, label: 'organization fuzzy:true' },
    { to: '/settings/external-data', fuzzy: true, label: 'external-data fuzzy:true' },
  ];

  return (
    <Card className="fixed right-4 bottom-4 z-50 max-w-md p-4 text-xs">
      <div className="font-bold">Debug: {current}</div>
      {tests.map((t) => {
        const result = matchRoute({ to: t.to, fuzzy: t.fuzzy });
        return (
          <div key={t.label} className="flex justify-between gap-2">
            <span>{t.label}:</span>
            <span className={result !== false ? 'text-red-500' : 'text-green-500'}>
              {JSON.stringify(result)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

export { DebugMatchRoute };
