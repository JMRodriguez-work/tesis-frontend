import { BuildingsIcon, CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useMe } from '@/api/queries/use-auth';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBranchesList, useCurrentBranch, useSetCurrentBranch } from '@/hooks/use-branch';
import { roleFromId } from '@/lib/role';

function BranchSelector() {
  const { data: me } = useMe();
  const branches = useBranchesList();
  const currentBranch = useCurrentBranch();
  const setCurrentBranch = useSetCurrentBranch();

  const role = roleFromId(me?.roleId ?? null);

  if (role !== 'Admin') {
    if (!currentBranch) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BuildingsIcon className="size-4" />
        <span>{currentBranch.name}</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return <Skeleton className="h-7 w-32" />;
  }

  if (branches.length === 1) {
    const only = branches[0];
    if (!only) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BuildingsIcon className="size-4" />
        <span>{only.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            <BuildingsIcon className="size-4" />
            <span>{currentBranch?.name ?? 'Elegir sucursal'}</span>
            <CaretDownIcon className="size-3" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel>Sucursal activa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setCurrentBranch(branch.id)}
            className="flex items-center justify-between"
          >
            <span>{branch.name}</span>
            {currentBranch?.id === branch.id ? (
              <CheckIcon className="size-4" weight="bold" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { BranchSelector };
