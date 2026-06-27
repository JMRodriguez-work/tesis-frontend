import { CubeIcon, PackageIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'items' | 'stock';

type ItemsModeToggleProps = {
  value: Mode;
  onChange: (mode: Mode) => void;
};

const MODES: Array<{ value: Mode; label: string; icon: typeof PackageIcon }> = [
  { value: 'items', label: 'Items', icon: CubeIcon },
  { value: 'stock', label: 'Stock', icon: PackageIcon },
];

function ItemsModeToggle({ value, onChange }: ItemsModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de visualización"
      className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-muted/30 p-1"
    >
      {MODES.map(({ value: mode, label, icon: Icon }) => {
        const isActive = value === mode;
        return (
          <Button
            key={mode}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(mode)}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={cn('h-7 gap-1.5 px-3', !isActive && 'text-muted-foreground')}
          >
            <Icon className="size-3.5" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export type { Mode };
export { ItemsModeToggle };
