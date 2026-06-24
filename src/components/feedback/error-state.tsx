import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { mapApiError } from '@/lib/api-error';

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  fallback?: ReactNode;
};

function ErrorState({ error, onRetry, fallback }: ErrorStateProps) {
  if (fallback) return <>{fallback}</>;
  const { message } = mapApiError(error);
  return (
    <div
      data-slot="error-state"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center"
    >
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
