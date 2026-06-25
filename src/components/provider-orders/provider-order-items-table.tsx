import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  useWatch,
} from 'react-hook-form';
import { useItems } from '@/api/queries/use-items';
import { useUnits } from '@/api/queries/use-units';
import { Button } from '@/components/ui/button';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import type { CreateProviderOrderFormValues } from '@/lib/schemas/provider-order';

type ItemFieldValues = {
  itemId: string;
  quantity: string;
  cost: string;
  unitId?: number;
};

type ProviderOrderItemsTableProps = {
  control: Control<CreateProviderOrderFormValues>;
  fields: FieldArrayWithId<CreateProviderOrderFormValues, 'items', 'id'>[];
  errors: FieldErrors<CreateProviderOrderFormValues>;
  branchId?: string;
  onAppend: () => void;
  onRemove: (index: number) => void;
};

function ProviderOrderItemsTable({
  control,
  fields,
  errors,
  branchId,
  onAppend,
  onRemove,
}: ProviderOrderItemsTableProps) {
  const { data: units } = useUnits();
  const { data: itemsData } = useItems(
    { branchId, limit: 100, isActive: true },
    { enabled: !!branchId },
  );

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

  const total = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, row) => {
      const q = Number(row.quantity);
      const c = Number(row.cost);
      if (Number.isNaN(q) || Number.isNaN(c)) return sum;
      return sum + q * c;
    }, 0);
  }, [watchedItems]);

  const itemsArrayError = errors.items;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Items de la orden *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAppend}>
          <PlusIcon className="size-3.5" />
          Agregar fila
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Agregá al menos un item a la orden.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Cantidad</th>
                <th className="p-2 font-medium">Costo unit.</th>
                <th className="p-2 font-medium">Unidad</th>
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
                  const c = Number(watchedRow.cost);
                  if (Number.isNaN(q) || Number.isNaN(c)) return 0;
                  return q * c;
                })();
                const rowError = Array.isArray(itemsArrayError)
                  ? itemsArrayError[index]
                  : undefined;
                return (
                  <tr key={row.id} className="border-b last:border-0 items-center">
                    <td className="p-2">
                      <Controller
                        control={control}
                        name={`items.${index}.itemId` as const}
                        render={({ field }) => (
                          <ComboboxField
                            id={`items.${index}.itemId`}
                            label=""
                            items={itemOptions}
                            value={field.value || null}
                            onValueChange={(value) => field.onChange(value ?? '')}
                            placeholder="Seleccionar item"
                            className="min-w-48"
                          />
                        )}
                      />
                      {rowError?.itemId ? (
                        <p className="mt-1 text-xs text-destructive">{rowError.itemId.message}</p>
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
                        id={`items.${index}.cost`}
                        inputMode="decimal"
                        placeholder="0.00"
                        {...control.register(`items.${index}.cost` as const)}
                      />
                      {rowError?.cost ? (
                        <p className="mt-1 text-xs text-destructive">{rowError.cost.message}</p>
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
                    <td className="p-2 text-right font-mono">
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
                <td colSpan={4} className="p-2 text-right text-muted-foreground">
                  Total
                </td>
                <td className="p-2 text-right font-mono">{formatCurrency(total)}</td>
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

export { ProviderOrderItemsTable };
