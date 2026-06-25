import type { ReactNode } from 'react';
import { Skeleton } from '@/components/feedback/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapApiError } from '@/lib/api-error';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: ReactNode;
};

function ChartCard({ title, subtitle, controls, isLoading, error, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {controls ? <div className="flex flex-wrap items-end gap-2">{controls}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>{mapApiError(error).message}</AlertDescription>
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export type { ChartCardProps };
export { ChartCard };
