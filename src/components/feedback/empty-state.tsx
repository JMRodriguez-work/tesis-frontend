import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center',
        className,
      )}
    >
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
