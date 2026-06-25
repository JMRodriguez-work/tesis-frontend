import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBranches } from '@/api/queries/use-branches';
import {
  useAssignWarehouseToBranch,
  useUnassignWarehouseFromBranch,
  type Warehouse,
} from '@/api/queries/use-warehouses';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';

type WarehouseBranchesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
};

function WarehouseBranchesDialog({ open, onOpenChange, warehouse }: WarehouseBranchesDialogProps) {
  const { data: branchesData, isLoading: branchesLoading } = useBranches({
    limit: 100,
    isActive: true,
  });
  const assignBranch = useAssignWarehouseToBranch();
  const unassignBranch = useUnassignWarehouseFromBranch();

  const branchOptions = useMemo(() => branchesData?.data ?? [], [branchesData]);

  const initialSelected = useMemo(
    () => new Set(warehouse?.branches.map((b) => b.id) ?? []),
    [warehouse],
  );

  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  useEffect(() => {
    if (open) {
      setSelected(new Set(warehouse?.branches.map((b) => b.id) ?? []));
    }
  }, [open, warehouse]);

  const toggle = (branchId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const onSave = async () => {
    if (!warehouse) return;
    const original = new Set(warehouse.branches.map((b) => b.id));
    const toAdd = [...selected].filter((id) => !original.has(id));
    const toRemove = [...original].filter((id) => !selected.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      for (const branchId of toAdd) {
        await assignBranch.mutateAsync({ id: warehouse.id, body: { branchId } });
      }
      for (const branchId of toRemove) {
        await unassignBranch.mutateAsync({ id: warehouse.id, branchId });
      }
      toast.success('Sucursales actualizadas');
      onOpenChange(false);
    } catch (err) {
      toast.error(mapApiError(err).message);
    }
  };

  const isPending = assignBranch.isPending || unassignBranch.isPending;
  const hasChanges =
    selected.size !== initialSelected.size || [...selected].some((id) => !initialSelected.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sucursales del depósito</DialogTitle>
          <DialogDescription>
            {warehouse
              ? `${warehouse.name} · ${selected.size} seleccionada${selected.size === 1 ? '' : 's'}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Sucursales disponibles</Label>
          {branchesLoading ? (
            <p className="text-xs text-muted-foreground">Cargando sucursales…</p>
          ) : branchOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay sucursales activas. Creá una en Configuración → Sucursales.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-none border border-border p-2">
              {branchOptions.map((branch) => {
                const checked = selected.has(branch.id);
                const inputId = `manage-warehouse-branch-${branch.id}`;
                return (
                  <div
                    key={branch.id}
                    className="flex cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Checkbox
                      id={inputId}
                      checked={checked}
                      onCheckedChange={() => toggle(branch.id)}
                    />
                    <label htmlFor={inputId} className="flex-1 cursor-pointer">
                      {branch.name}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} disabled={isPending || !hasChanges}>
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { WarehouseBranchesDialog };
