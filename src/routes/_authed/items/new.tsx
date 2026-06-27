import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  BarcodeIcon,
  PackageIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { type Category, useItemCategories } from '@/api/queries/use-item-categories';
import { useCreateItem } from '@/api/queries/use-items';
import { useUnits } from '@/api/queries/use-units';
import { useUpsertStock, useWarehouses } from '@/api/queries/use-warehouses';
import { CategoryCreateDialog } from '@/components/items/category-create-dialog';
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
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;

  const createItem = useCreateItem();
  const upsertStock = useUpsertStock();
  const { data: categories } = useItemCategories(
    {
      branchId: adminBranchId,
      isActive: true,
    },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );
  const { data: units } = useUnits();
  const { data: warehouses } = useWarehouses({ isActive: true, limit: 100 });

  const categoryItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Sin categoría —', value: null },
      ...(categories?.data.map((cat) => ({ label: cat.name, value: cat.id })) ?? []),
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

  const warehouseItems: ComboboxItem[] = useMemo(
    () => [
      { label: '— Asignar después —', value: null },
      ...(warehouses?.data.filter((w) => w.isActive).map((w) => ({ label: w.name, value: w.id })) ??
        []),
    ],
    [warehouses],
  );

  const [pricingWarning, setPricingWarning] = useState<{
    field: 'salePrice';
    message: string;
    salePrice: string;
    purchasePrice: string;
  } | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  type StockState = {
    warehouseId: string | null;
    quantity: string;
    minStock: string;
  };

  const [initialStock, setInitialStock] = useState<StockState>({
    warehouseId: null,
    quantity: '',
    minStock: '',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema) as Resolver<CreateItemInput>,
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
        branchId: adminBranchId,
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
          const qty = initialStock.quantity.trim();
          const wh = initialStock.warehouseId;
          if (wh && qty && Number(qty) > 0) {
            const minStock = initialStock.minStock.trim();
            upsertStock.mutate(
              {
                warehouseId: wh,
                body: {
                  itemId: data.item.id,
                  quantity: qty,
                  ...(minStock && Number(minStock) >= 0 ? { minStock } : {}),
                },
              },
              {
                onSuccess: () => {
                  toast.success('Item creado con stock inicial');
                  void navigate({
                    to: '/items/$itemId',
                    params: { itemId: data.item.id },
                  });
                },
                onError: (err) => {
                  toast.error(
                    `Item creado, pero falló el stock inicial: ${mapApiError(err).message}`,
                  );
                  void navigate({
                    to: '/items/$itemId',
                    params: { itemId: data.item.id },
                  });
                },
              },
            );
            return;
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
          <div className="flex flex-col gap-1.5">
            <ComboboxField
              id="categoryId"
              label="Categoría"
              items={categoryItems}
              value={watch('categoryId') ?? null}
              onValueChange={(value) => setValue('categoryId', value ?? undefined)}
              placeholder="Sin categoría"
            />
            {role !== 'Employee' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateCategoryOpen(true)}
                className="self-start"
              >
                <PlusIcon className="size-3.5" />
                Nueva categoría
              </Button>
            ) : null}
          </div>
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

        {role !== 'Employee' ? (
          <fieldset className="flex flex-col gap-3 rounded-md border border-dashed border-border p-3">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-medium">
              <PackageIcon className="size-3.5" />
              Stock inicial (opcional)
            </legend>
            <p className="text-xs text-muted-foreground">
              Si asignás stock inicial, el item se crea con la cantidad indicada en el depósito.
              Podés ajustarlo después.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ComboboxField
                id="initialWarehouseId"
                label="Depósito"
                items={warehouseItems}
                value={initialStock.warehouseId}
                onValueChange={(value) =>
                  setInitialStock((prev) => ({ ...prev, warehouseId: value }))
                }
                placeholder={
                  warehouses && warehouses.data.length > 0
                    ? 'Seleccioná un depósito'
                    : 'No hay depósitos activos'
                }
                className="sm:col-span-1"
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="initialQuantity">Cantidad</Label>
                <Input
                  id="initialQuantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={initialStock.quantity}
                  disabled={!initialStock.warehouseId}
                  onChange={(e) =>
                    setInitialStock((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="initialMinStock">Stock mínimo</Label>
                <Input
                  id="initialMinStock"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={initialStock.minStock}
                  disabled={!initialStock.warehouseId}
                  onChange={(e) =>
                    setInitialStock((prev) => ({ ...prev, minStock: e.target.value }))
                  }
                />
              </div>
            </div>
            {initialStock.warehouseId &&
            initialStock.quantity &&
            Number(initialStock.quantity) > 0 ? (
              <p className="text-xs text-muted-foreground">
                Se creará un movimiento de stock inicial en el depósito seleccionado.
              </p>
            ) : null}
          </fieldset>
        ) : null}

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
          <Button type="submit" disabled={createItem.isPending}>
            {createItem.isPending ? 'Creando…' : 'Crear item'}
          </Button>
        </div>
      </form>

      <CategoryCreateDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        branchId={role === 'Admin' ? (currentBranchId ?? undefined) : undefined}
        onCreated={(category: Category) =>
          setValue('categoryId', category.id, { shouldValidate: true })
        }
      />
    </div>
  );
}

export { Route };
