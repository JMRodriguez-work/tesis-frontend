import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useCreateProviderOrder } from '@/api/queries/use-provider-orders';
import { useProviders } from '@/api/queries/use-providers';
import { ProviderOrderItemsTable } from '@/components/provider-orders/provider-order-items-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import {
  type CreateProviderOrderFormValues,
  type CreateProviderOrderInput,
  createProviderOrderSchema,
} from '@/lib/schemas/provider-order';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/provider-orders/new')({
  component: NewProviderOrderPage,
});

const EMPTY_ITEM = { itemId: '', quantity: '', cost: '', unitId: undefined };

function NewProviderOrderPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const { data: providers } = useProviders({ limit: 100, showInactive: false });
  const createOrder = useCreateProviderOrder();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProviderOrderFormValues>({
    resolver: zodResolver(createProviderOrderSchema),
    defaultValues: {
      providerId: '',
      estimatedDelivery: '',
      items: [EMPTY_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const providerItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Seleccionar proveedor —', value: null },
      ...(providers?.data.map((p) => ({ label: p.name, value: p.id })) ?? []),
    ],
    [providers],
  );

  const onSubmit = (values: CreateProviderOrderFormValues) => {
    const branchId = adminBranchId ?? me?.branchId ?? '';
    if (!branchId) {
      toast.error('No se pudo determinar la sucursal');
      return;
    }
    const input: CreateProviderOrderInput = {
      providerId: values.providerId,
      ...(values.estimatedDelivery ? { estimatedDelivery: values.estimatedDelivery } : {}),
      items: values.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        cost: item.cost,
        ...(item.unitId ? { unitId: item.unitId } : {}),
      })),
    };
    createOrder.mutate(
      { body: input, branchId },
      {
        onSuccess: (order) => {
          toast.success('Orden creada');
          void navigate({
            to: '/provider-orders/$orderId',
            params: { orderId: order.id },
          });
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
          to="/provider-orders"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Nueva orden a proveedor</h1>
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Sucursal requerida</AlertTitle>
            <AlertDescription>
              Seleccioná una sucursal activa en el selector del topbar para crear la orden.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="providerId"
            render={({ field }) => (
              <ComboboxField
                id="providerId"
                label="Proveedor *"
                items={providerItems}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value ?? '')}
                placeholder="Seleccionar proveedor"
              />
            )}
          />
          {errors.providerId ? (
            <p className="text-xs text-destructive sm:col-span-2 -mt-3">
              {errors.providerId.message}
            </p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimatedDelivery">Entrega estimada</Label>
            <Input id="estimatedDelivery" type="date" {...register('estimatedDelivery')} />
          </div>
        </div>

        <ProviderOrderItemsTable
          control={control}
          fields={fields}
          errors={errors}
          branchId={adminBranchId ?? me?.branchId ?? undefined}
          onAppend={() => append({ itemId: '', quantity: '', cost: '' })}
          onRemove={(index) => remove(index)}
        />

        <div className="flex justify-end gap-2">
          <Link to="/provider-orders" className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || createOrder.isPending || showBranchWarning}
          >
            {createOrder.isPending ? 'Creando…' : 'Crear orden'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { Route };
