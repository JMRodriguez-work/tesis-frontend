import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef } from 'react';
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { type ItemListRow, useItems } from '@/api/queries/use-items';
import { useUnits } from '@/api/queries/use-units';
import { useWarehouses } from '@/api/queries/use-warehouses';
import { SaleItemStockHint } from '@/components/sales/sale-item-stock-hint';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import type { CreateSaleFormValues } from '@/lib/schemas/sale';
import { cn } from '@/lib/utils';

type ItemFieldValues = {
  itemId: string;
  warehouseId: string;
  quantity: string;
  price: string;
  unitId?: number;
};

type SaleItemsTableProps = {
  control: Control<CreateSaleFormValues>;
  setValue: UseFormSetValue<CreateSaleFormValues>;
  fields: FieldArrayWithId<CreateSaleFormValues, 'items', 'id'>[];
  errors: FieldErrors<CreateSaleFormValues>;
  branchId?: string;
  onAppend: () => void;
  onRemove: (index: number) => void;
};

function SaleItemsTable({
  control,
  setValue,
  fields,
  errors,
  branchId,
  onAppend,
  onRemove,
}: SaleItemsTableProps) {
  const { data: units } = useUnits();
  const { data: itemsData } = useItems(
    { branchId, limit: 100, isActive: true },
    { enabled: !!branchId },
  );
  const { data: warehousesData } = useWarehouses({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const filteredWarehouses = useMemo(() => {
    if (!warehousesData?.data || !branchId) return [];
    return warehousesData.data.filter((w) => w.branches.some((b) => b.id === branchId));
  }, [warehousesData, branchId]);

  const watchedItems = useWatch({ control, name: 'items' }) as ItemFieldValues[] | undefined;

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

  const total = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, row) => {
      const q = Number(row.quantity);
      const p = Number(row.price);
      if (Number.isNaN(q) || Number.isNaN(p)) return sum;
      return sum + q * p;
    }, 0);
  }, [watchedItems]);

  const itemsArrayError = errors.items;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Items de la venta *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAppend}>
          <PlusIcon className="size-3.5" />
          Agregar fila
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Agregá al menos un item a la venta.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Cantidad</th>
                <th className="p-2 font-medium">Precio</th>
                <th className="p-2 font-medium">Unidad</th>
                <th className="p-2 font-medium">Depósito</th>
                <th className="p-2 font-medium text-right">Subtotal</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {fields.map((row, index) => {
                const watchedRow = watchedItems?.[index];
                const lineSubtotal = (() => {
                  if (!watchedRow) return 0;
                  const q = Number(watchedRow.quantity);
                  const p = Number(watchedRow.price);
                  if (Number.isNaN(q) || Number.isNaN(p)) return 0;
                  return q * p;
                })();
                const rowError = Array.isArray(itemsArrayError)
                  ? itemsArrayError[index]
                  : undefined;
                return (
                  <tr key={row.id} className={cn('border-b last:border-0 items-center align-top')}>
                    <td className="p-2 min-w-48">
                      <ItemCombobox
                        control={control}
                        setValue={setValue}
                        index={index}
                        items={itemOptions}
                        itemsData={itemsData?.data ?? []}
                        error={rowError?.itemId?.message}
                      />
                      {watchedRow ? (
                        <div className="mt-1">
                          <SaleItemStockHint
                            itemId={watchedRow.itemId ?? ''}
                            warehouseId={watchedRow.warehouseId ?? ''}
                            quantity={watchedRow.quantity ?? ''}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <Input
                        id={`items.${index}.quantity`}
                        inputMode="decimal"
                        placeholder="0.000"
                        {...control.register(`items.${index}.quantity` as const)}
                      />
                      {rowError?.quantity ? (
                        <p className="mt-1 text-xs text-destructive">{rowError.quantity.message}</p>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <Input
                        id={`items.${index}.price`}
                        inputMode="decimal"
                        placeholder="0.00"
                        {...control.register(`items.${index}.price` as const)}
                      />
                      {rowError?.price ? (
                        <p className="mt-1 text-xs text-destructive">{rowError.price.message}</p>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <Controller
                        control={control}
                        name={`items.${index}.unitId` as const}
                        render={({ field }) => (
                          <ComboboxField
                            id={`items.${index}.unitId`}
                            label=""
                            items={unitItems}
                            value={
                              field.value !== undefined && field.value !== null
                                ? String(field.value)
                                : null
                            }
                            onValueChange={(value) =>
                              field.onChange(value === null ? undefined : Number(value))
                            }
                            placeholder="Sin unidad"
                            className="min-w-40"
                          />
                        )}
                      />
                    </td>
                    <td className="p-2 min-w-44">
                      <Controller
                        control={control}
                        name={`items.${index}.warehouseId` as const}
                        render={({ field }) => (
                          <ComboboxField
                            id={`items.${index}.warehouseId`}
                            label=""
                            items={warehouseOptions}
                            value={field.value || null}
                            onValueChange={(value) => field.onChange(value ?? '')}
                            placeholder={
                              filteredWarehouses.length === 0 ? 'Sin depósitos' : 'Seleccionar'
                            }
                            className="min-w-44"
                          />
                        )}
                      />
                      {rowError?.warehouseId ? (
                        <p className="mt-1 text-xs text-destructive">
                          {rowError.warehouseId.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-2 text-right font-mono whitespace-nowrap">
                      {lineSubtotal > 0 ? formatCurrency(lineSubtotal) : '—'}
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemove(index)}
                        aria-label={`Quitar fila ${index + 1}`}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-slate-50 font-medium">
                <td colSpan={5} className="p-2 text-right text-muted-foreground">
                  Subtotal
                </td>
                <td className="p-2 text-right font-mono whitespace-nowrap">
                  {formatCurrency(total)}
                </td>
                <td className="p-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {typeof itemsArrayError?.message === 'string' ? (
        <p className="text-xs text-destructive">{itemsArrayError.message}</p>
      ) : null}
    </div>
  );
}

type ItemComboboxProps = {
  control: Control<CreateSaleFormValues>;
  setValue: UseFormSetValue<CreateSaleFormValues>;
  index: number;
  items: ComboboxItem[];
  itemsData: ItemListRow[];
  error?: string;
};

function ItemCombobox({ control, setValue, index, items, itemsData, error }: ItemComboboxProps) {
  const itemId = useWatch({ control, name: `items.${index}.itemId` as const }) as string;
  const itemData = itemsData.find((it) => it.id === itemId);
  const prefilledRef = useRef<string | null>(null);

  // External sync: when the user picks an item, prefill the price from item.salePrice
  // (AGENTS §2.1.2 — sync between query data and RHF state).
  useEffect(() => {
    if (itemData?.salePrice && prefilledRef.current !== itemId) {
      setValue(`items.${index}.price` as const, itemData.salePrice, { shouldValidate: true });
      prefilledRef.current = itemId;
    }
    if (!itemId) {
      prefilledRef.current = null;
    }
  }, [itemId, itemData, setValue, index]);

  return (
    <div className="flex flex-col gap-1">
      <Controller
        control={control}
        name={`items.${index}.itemId` as const}
        render={({ field }) => (
          <ComboboxField
            id={`items.${index}.itemId`}
            label=""
            items={items}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? '')}
            placeholder="Seleccionar item"
            className="min-w-48"
          />
        )}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export { SaleItemsTable };
