import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, BarcodeIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { type Category, useItemCategories } from '@/api/queries/use-item-categories';
import { useItem, useUpdateItem } from '@/api/queries/use-items';
import { useUnits } from '@/api/queries/use-units';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { CategoryCreateDialog } from '@/components/items/category-create-dialog';
import { PricingWarning } from '@/components/items/pricing-warning';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import { type UpdateItemInput, updateItemSchema } from '@/lib/schemas/item';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/items/$itemId/edit')({
  component: EditItemPage,
});

function EditItemPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const currentBranchId = useCurrentBranchId();
  const adminBranchId = role === 'Admin' ? (currentBranchId ?? undefined) : undefined;
  const { data: itemData, isLoading, error, refetch } = useItem(itemId);
  const updateItem = useUpdateItem();
  const { data: categories } = useItemCategories(
    { branchId: adminBranchId, isActive: true },
    { enabled: role !== 'Admin' || !!currentBranchId },
  );
  const { data: units } = useUnits();
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

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
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateItemSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (itemData) {
      reset({
        name: itemData.item.name,
        isActive: itemData.item.isActive,
        description: itemData.item.description ?? '',
        categoryId: itemData.item.categoryId ?? undefined,
        baseUnitId: itemData.item.baseUnitId ?? undefined,
        purchasePrice: itemData.item.purchasePrice ?? '',
        salePrice: itemData.item.salePrice ?? '',
        code: itemData.item.code ?? '',
        barcode: itemData.item.barcode ?? '',
      });
    }
  }, [itemData, reset]);

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

  const onSubmit = (values: FormValues) => {
    setPricingWarning(null);
    const body: UpdateItemInput = {
      name: values.name,
      isActive: values.isActive,
      ...(values.description !== undefined ? { description: values.description || null } : {}),
      ...(values.categoryId !== undefined ? { categoryId: values.categoryId || null } : {}),
      ...(values.baseUnitId !== undefined ? { baseUnitId: values.baseUnitId || null } : {}),
      ...(values.purchasePrice !== undefined
        ? { purchasePrice: values.purchasePrice || null }
        : {}),
      ...(values.salePrice !== undefined ? { salePrice: values.salePrice || null } : {}),
      ...(values.code !== undefined ? { code: values.code || null } : {}),
      ...(values.barcode !== undefined ? { barcode: values.barcode || null } : {}),
    };
    updateItem.mutate(
      { id: itemId, body },
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
          toast.success('Item actualizado');
          void navigate({ to: '/items/$itemId', params: { itemId } });
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !itemData) {
    return (
      <div className="p-6">
        <ErrorState
          error={error ?? new Error('Item no encontrado')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center gap-2">
        <Link
          to="/items/$itemId"
          params={{ itemId }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Editar item</h1>
      </header>

      {!itemData.item.isActive ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Item inactivo</AlertTitle>
            <AlertDescription>Marcá "Activo" para reactivar este item.</AlertDescription>
          </div>
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setValue('isActive', checked === true)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Activo
          </Label>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            to="/items/$itemId"
            params={{ itemId }}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={updateItem.isPending}>
            {updateItem.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <CategoryCreateDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onCreated={(category: Category) =>
          setValue('categoryId', category.id, { shouldValidate: true })
        }
      />
    </div>
  );
}

export { Route };
