import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { ErrorState } from '@/components/feedback/error-state';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';

type RouterContext = { queryClient: QueryClient };

const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-svh items-center justify-center p-6">
          <ErrorState
            error={new Error('Algo se rompió al renderizar la página.')}
            onRetry={() => window.location.reload()}
          />
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-right" richColors />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export { Route };
