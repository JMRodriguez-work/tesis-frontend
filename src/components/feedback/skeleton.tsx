import { cn } from '@/lib/cn';

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-muted', className)} />
  );
}

export { Skeleton };
