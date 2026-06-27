import { Skeleton } from '@/components/feedback/skeleton';

function AuthedPending() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export { AuthedPending };
