import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, BarcodeIcon, InfoIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useCustomers } from '@/api/queries/use-customers';
import { useCreateSale } from '@/api/queries/use-sales';
import { SaleItemsTable } from '@/components/sales/sale-items-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { formatCurrency, formatDecimal } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import {
  type CreateSaleFormValues,
  type CreateSaleInput,
  createSaleSchema,
} from '@/lib/schemas/sale';
import { cn } from '@/lib/utils';

const EMPTY_ITEM = {
  itemId: '',
  warehouseId: '',
  quantity: '',
  price: '',
  unitId: undefined,
};

const Route = createFileRoute('/_authed/sales/new')({
  component: NewSalePage,
});

function NewSalePage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const branchId = adminBranchId ?? me?.branchId ?? '';
  const showBranchWarning = role === 'Admin' && !currentBranchId;

  const { data: customers } = useCustomers(
    { limit: 100, showInactive: false, branchId: adminBranchId },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );
  const createSale = useCreateSale();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSaleFormValues>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      customerId: '',
      discountPercent: '',
      notes: '',
      items: [EMPTY_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = useWatch({ control, name: 'items' });
  const watchedDiscount = useWatch({ control, name: 'discountPercent' });

  const customerItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Consumidor final —', value: null },
      ...(customers?.data.map((c) => ({ label: c.fullname, value: c.id })) ?? []),
    ],
    [customers],
  );

  const subtotal = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, row) => {
      const q = Number(row.quantity);
      const p = Number(row.price);
      if (Number.isNaN(q) || Number.isNaN(p)) return sum;
      return sum + q * p;
    }, 0);
  }, [watchedItems]);

  const discountValue = useMemo(() => {
    if (!watchedDiscount) return 0;
    const n = Number(watchedDiscount);
    return Number.isNaN(n) ? 0 : n;
  }, [watchedDiscount]);

  const total = useMemo(() => {
    const disc = Math.max(0, Math.min(100, discountValue));
    return subtotal * (1 - disc / 100);
  }, [subtotal, discountValue]);

  const onSubmit = (values: CreateSaleFormValues) => {
    if (!branchId && role === 'Admin') {
      toast.error('Seleccioná una sucursal activa en el topbar');
      return;
    }
    const input: CreateSaleInput = {
      items: values.items.map((item) => ({
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        price: item.price,
        ...(item.unitId !== undefined ? { unitId: item.unitId } : {}),
      })),
      ...(values.customerId ? { customerId: values.customerId } : {}),
      ...(values.discountPercent ? { discountPercent: values.discountPercent } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    createSale.mutate(
      { body: input, branchId: branchId || undefined },
      {
        onSuccess: (sale) => {
          toast.success('Venta registrada');
          void navigate({ to: '/sales/$saleId', params: { saleId: sale.id } });
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    );
  };

  const handleScannerPlaceholder = () => {
    toast.info('Scanner no disponible en MVP');
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center gap-2">
        <Link to="/sales" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Nueva venta</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleScannerPlaceholder}
          className="ml-auto"
        >
          <BarcodeIcon className="size-4" />
          Escanear
        </Button>
      </header>

      {showBranchWarning ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Sucursal requerida</AlertTitle>
            <AlertDescription>
              Seleccioná una sucursal activa en el selector del topbar para registrar ventas.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <ComboboxField
                id="customerId"
                label="Cliente"
                items={customerItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
                placeholder="Consumidor final"
              />
            )}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discountPercent">Descuento % (opcional)</Label>
            <Input
              id="discountPercent"
              inputMode="decimal"
              placeholder="0.00"
              {...register('discountPercent')}
            />
            {errors.discountPercent ? (
              <p className="text-xs text-destructive">{errors.discountPercent.message}</p>
            ) : null}
          </div>
        </div>

        <SaleItemsTable
          control={control}
          setValue={setValue}
          fields={fields}
          errors={errors}
          branchId={adminBranchId ?? me?.branchId ?? undefined}
          onAppend={() => append(EMPTY_ITEM)}
          onRemove={(index) => remove(index)}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Observaciones de la venta"
            rows={2}
            {...register('notes')}
          />
        </div>

        <div className="flex flex-col items-end gap-1 rounded-lg border border-border bg-slate-50 p-4 text-xs">
          <div className="flex w-64 items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          {discountValue > 0 ? (
            <div className="flex w-64 items-center justify-between">
              <span className="text-muted-foreground">
                Descuento ({formatDecimal(discountValue)}%)
              </span>
              <span className="font-mono text-red-600">−{formatCurrency(subtotal - total)}</span>
            </div>
          ) : null}
          <div className="flex w-64 items-center justify-between border-t border-border pt-1 text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        <Alert>
          <InfoIcon className="size-4" weight="regular" />
          <AlertDescription className="text-xs">
            La venta descuenta stock de los depósitos indicados. El cliente puede ser Consumidor final.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end gap-2">
          <Link to="/sales" className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || createSale.isPending || showBranchWarning}
          >
            {createSale.isPending ? 'Registrando…' : 'Registrar venta'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { Route };
