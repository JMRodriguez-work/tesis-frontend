import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useBranches } from '@/api/queries/use-branches';
import { useCreateWarehouse } from '@/api/queries/use-warehouses';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mapApiError } from '@/lib/api-error';
import {
  type CreateWarehouseFormValues,
  type CreateWarehouseInput,
  createWarehouseSchema,
} from '@/lib/schemas/warehouse';

type WarehouseCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function WarehouseCreateDialog({ open, onOpenChange }: WarehouseCreateDialogProps) {
  const createWarehouse = useCreateWarehouse();
  const { data: branchesData, isLoading: branchesLoading } = useBranches({
    limit: 100,
    isActive: true,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: '',
      description: '',
      branchIds: [],
    },
  });

  const selectedBranchIds = watch('branchIds') ?? [];

  const branchOptions = useMemo(() => branchesData?.data ?? [], [branchesData]);

  const toggleBranch = (branchId: string) => {
    const next = selectedBranchIds.includes(branchId)
      ? selectedBranchIds.filter((id) => id !== branchId)
      : [...selectedBranchIds, branchId];
    setValue('branchIds', next, { shouldValidate: true });
  };

  const onSubmit = (values: CreateWarehouseFormValues) => {
    const body: CreateWarehouseInput = {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : undefined,
      branchIds: values.branchIds,
    };
    createWarehouse.mutate(body, {
      onSuccess: () => {
        toast.success('Depósito creado');
        reset();
        onOpenChange(false);
      },
      onError: (err) => toast.error(mapApiError(err).message),
    });
  };

  const canSubmit = !branchesLoading && selectedBranchIds.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo depósito</DialogTitle>
          <DialogDescription>
            Asigná al menos una sucursal. Las sucursales se pueden modificar después.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-warehouse-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warehouse-name">Nombre *</Label>
            <Input id="warehouse-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warehouse-description">Descripción</Label>
            <Textarea
              id="warehouse-description"
              autoComplete="off"
              rows={3}
              {...register('description')}
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label>Sucursales *</Label>
              <span className="text-xs text-muted-foreground">
                {selectedBranchIds.length} seleccionada{selectedBranchIds.length === 1 ? '' : 's'}
              </span>
            </div>
            {branchesLoading ? (
              <p className="text-xs text-muted-foreground">Cargando sucursales…</p>
            ) : branchOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay sucursales activas. Creá una en Configuración → Sucursales.
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-none border border-border p-2">
                {branchOptions.map((branch) => {
                  const checked = selectedBranchIds.includes(branch.id);
                  const inputId = `warehouse-branch-${branch.id}`;
                  return (
                    <div
                      key={branch.id}
                      className="flex cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <label htmlFor={inputId} className="flex-1 cursor-pointer">
                        {branch.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.branchIds ? (
              <p className="text-xs text-destructive">{errors.branchIds.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-warehouse-form"
              disabled={isSubmitting || createWarehouse.isPending || !canSubmit}
            >
              {createWarehouse.isPending ? 'Creando…' : 'Crear depósito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { WarehouseCreateDialog };
