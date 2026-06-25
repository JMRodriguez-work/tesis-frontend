import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useItems } from '@/api/queries/use-items';
import { useTransferStock } from '@/api/queries/use-stock-movements';
import { useWarehouses } from '@/api/queries/use-warehouses';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import {
  type TransferStockFormValues,
  type TransferStockInput,
  transferStockSchema,
} from '@/lib/schemas/stock-movement';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/stock-movements/new-transfer')({
  component: NewTransferPage,
});

function NewTransferPage() {
  const navigate = useNavigate();

  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const branchId = adminBranchId ?? me?.branchId ?? '';
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const { data: itemsData } = useItems(
    { branchId: adminBranchId, limit: 100, isActive: true },
    { enabled: !!branchId },
  );
  const { data: warehousesData } = useWarehouses({
    page: 1,
    limit: 100,
    isActive: true,
  });
  const transferStock = useTransferStock();

  const filteredWarehouses = useMemo(() => {
    if (!warehousesData?.data || !branchId) return [];
    return warehousesData.data.filter((w) => w.branches.some((b) => b.id === branchId));
  }, [warehousesData, branchId]);

  const itemOptions: ComboboxItem[] = useMemo(
    () => [
      { label: '— Seleccionar item —', value: null },
      ...(itemsData?.data.map((item) => ({
        label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
        value: item.id,
      })) ?? []),
    ],
    [itemsData],
  );

  const warehouseOptions: ComboboxItem[] = useMemo(
    () => [
      { label: '— Seleccionar depósito —', value: null },
      ...filteredWarehouses.map((w) => ({ label: w.name, value: w.id })),
    ],
    [filteredWarehouses],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransferStockFormValues>({
    resolver: zodResolver(transferStockSchema),
    defaultValues: {
      itemId: '',
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: '',
      notes: '',
    },
  });

  const fromWarehouseId = watch('fromWarehouseId');

  const onSubmit = (values: TransferStockFormValues) => {
    if (!branchId) {
      toast.error('No se pudo determinar la sucursal');
      return;
    }
    const input: TransferStockInput = {
      itemId: values.itemId,
      fromWarehouseId: values.fromWarehouseId,
      toWarehouseId: values.toWarehouseId,
      quantity: values.quantity,
      ...(values.notes ? { notes: values.notes } : {}),
    };
    transferStock.mutate(
      { body: input, branchId },
      {
        onSuccess: () => {
          toast.success('Transferencia realizada');
          void navigate({ to: '/stock-movements' });
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center gap-2">
        <Link
          to="/stock-movements"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Nueva transferencia de stock</h1>
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Sucursal requerida</AlertTitle>
            <AlertDescription>
              Seleccioná una sucursal activa en el selector del topbar para crear la transferencia.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <Controller
          control={control}
          name="itemId"
          render={({ field }) => (
            <ComboboxField
              id="itemId"
              label="Item *"
              items={itemOptions}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? '')}
              placeholder="Seleccionar item"
            />
          )}
        />
        {errors.itemId ? (
          <p className="text-xs text-destructive -mt-3">{errors.itemId.message}</p>
        ) : null}

        <Controller
          control={control}
          name="fromWarehouseId"
          render={({ field }) => (
            <ComboboxField
              id="fromWarehouseId"
              label="Depósito origen *"
              items={warehouseOptions}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? '')}
              placeholder={
                filteredWarehouses.length === 0
                  ? 'Sin depósitos en esta sucursal'
                  : 'Seleccionar depósito'
              }
            />
          )}
        />
        {errors.fromWarehouseId ? (
          <p className="text-xs text-destructive -mt-3">{errors.fromWarehouseId.message}</p>
        ) : null}

        <Controller
          control={control}
          name="toWarehouseId"
          render={({ field }) => (
            <ComboboxField
              id="toWarehouseId"
              label="Depósito destino *"
              items={warehouseOptions}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? '')}
              placeholder="Seleccionar depósito"
            />
          )}
        />
        {errors.toWarehouseId ? (
          <p className="text-xs text-destructive -mt-3">{errors.toWarehouseId.message}</p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Cantidad *</Label>
          <Input
            id="quantity"
            inputMode="decimal"
            placeholder="0.000"
            {...register('quantity')}
            disabled={!fromWarehouseId}
          />
          {errors.quantity ? (
            <p className="text-xs text-destructive">{errors.quantity.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            placeholder="Motivo de la transferencia (opcional)"
            rows={3}
            {...register('notes')}
          />
          {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/stock-movements" className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || transferStock.isPending || showBranchWarning}
          >
            {transferStock.isPending ? 'Guardando…' : 'Confirmar transferencia'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { Route };
