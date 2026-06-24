import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, BarcodeIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useItemCategories } from '@/api/queries/use-item-categories';
import { useCreateItem } from '@/api/queries/use-items';
import { useUnits } from '@/api/queries/use-units';
import { PricingWarning } from '@/components/items/pricing-warning';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import { type CreateItemInput, createItemSchema } from '@/lib/schemas/item';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/items/new')({
  component: NewItemPage,
});

function NewItemPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const isAdminWithoutBranch = role === 'Admin' && !currentBranchId;

  const createItem = useCreateItem();
  const { data: categories } = useItemCategories({
    branchId: role === 'Admin' ? (currentBranchId ?? undefined) : undefined,
    isActive: true,
  });
  const { data: units } = useUnits();

  const categoryItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Sin categoría —', value: null },
      ...(categories?.map((cat) => ({ label: cat.name, value: cat.id })) ?? []),
    ],
    [categories],
  );

  const unitItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Sin unidad —', value: null },
      ...(units?.map((unit) => ({
        label: `${unit.name} (${unit.abbreviation})`,
        value: unit.id.toString(),
      })) ?? []),
    ],
    [units],
  );

  const [pricingWarning, setPricingWarning] = useState<{
    field: 'salePrice';
    message: string;
    salePrice: string;
    purchasePrice: string;
  } | null>(null);

  type FormValues = {
    name: string;
    description?: string;
    categoryId?: string;
    baseUnitId?: number;
    purchasePrice?: string;
    salePrice?: string;
    code?: string;
    barcode?: string;
    isActive: boolean;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createItemSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      description: '',
      code: '',
      barcode: '',
      purchasePrice: '',
      salePrice: '',
      isActive: true,
    },
  });

  const purchasePrice = watch('purchasePrice');
  const salePrice = watch('salePrice');
  const isActive = watch('isActive');

  const inlinePricingWarning = (() => {
    if (!purchasePrice || !salePrice) return null;
    const p = Number(purchasePrice);
    const s = Number(salePrice);
    if (Number.isNaN(p) || Number.isNaN(s) || s >= p) return null;
    return `El precio de venta (${salePrice}) es menor al de compra (${purchasePrice})`;
  })();

  const onSubmit = (values: CreateItemInput) => {
    setPricingWarning(null);
    createItem.mutate(
      {
        body: values,
        branchId: role === 'Admin' ? (currentBranchId ?? undefined) : undefined,
      },
      {
        onSuccess: (data) => {
          if (data.warning) {
            setPricingWarning({
              field: 'salePrice',
              message: data.warning.message,
              salePrice: data.warning.salePrice,
              purchasePrice: data.warning.purchasePrice,
            });
          }
          toast.success('Item creado');
          void navigate({
            to: '/items/$itemId',
            params: { itemId: data.item.id },
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
        <Link to="/items" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Nuevo item</h1>
      </header>

      {isAdminWithoutBranch ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <AlertDescription>Seleccioná una sucursal antes de crear un item.</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" autoComplete="off" {...register('name')} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Código</Label>
            <Input id="code" autoComplete="off" {...register('code')} />
            {errors.code ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-1">
              <Input id="barcode" autoComplete="off" className="flex-1" {...register('barcode')} />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Escanear barcode"
                onClick={() => toast.info('Scanner no disponible en MVP')}
              >
                <BarcodeIcon className="size-4" />
              </Button>
            </div>
            {errors.barcode ? (
              <p className="text-xs text-destructive">{errors.barcode.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" rows={3} {...register('description')} />
          {errors.description ? (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="purchasePrice">Precio de compra</Label>
            <Input
              id="purchasePrice"
              inputMode="decimal"
              placeholder="0.00"
              {...register('purchasePrice')}
            />
            {errors.purchasePrice ? (
              <p className="text-xs text-destructive">{errors.purchasePrice.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="salePrice">Precio de venta</Label>
            <Input
              id="salePrice"
              inputMode="decimal"
              placeholder="0.00"
              {...register('salePrice')}
            />
            {errors.salePrice ? (
              <p className="text-xs text-destructive">{errors.salePrice.message}</p>
            ) : null}
          </div>
        </div>

        {inlinePricingWarning ? (
          <Alert variant="warning">
            <WarningIcon weight="fill" />
            <AlertDescription>{inlinePricingWarning}</AlertDescription>
          </Alert>
        ) : null}

        {pricingWarning ? (
          <PricingWarning warning={pricingWarning} onDismiss={() => setPricingWarning(null)} />
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <ComboboxField
            id="categoryId"
            label="Categoría"
            items={categoryItems}
            value={watch('categoryId') ?? null}
            onValueChange={(value) => setValue('categoryId', value ?? undefined)}
            placeholder="Sin categoría"
          />
          <ComboboxField
            id="baseUnitId"
            label="Unidad base"
            items={unitItems}
            value={watch('baseUnitId')?.toString() ?? null}
            onValueChange={(value) =>
              setValue('baseUnitId', value === null ? undefined : Number(value))
            }
            placeholder="Sin unidad"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={isActive ?? true}
            onCheckedChange={(checked) => setValue('isActive', checked === true)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Activo
          </Label>
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/items" className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </Link>
          <Button type="submit" disabled={createItem.isPending || isAdminWithoutBranch}>
            {createItem.isPending ? 'Creando…' : 'Crear item'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { Route };
