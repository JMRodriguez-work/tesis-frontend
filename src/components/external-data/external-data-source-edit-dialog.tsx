import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ExternalDataSource,
  useExternalDataSource,
  useUpdateExternalDataSource,
} from '@/api/queries/use-external-data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';
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
  type UpdateExternalDataSourceFormValues,
  type UpdateExternalDataSourceInput,
  updateExternalDataSourceSchema,
} from '@/lib/schemas/external-data';
import { EXTERNAL_DATA_TYPE_LABELS, ExternalDataTypeBadge } from './external-data-type-badge';

type ExternalDataSourceEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ExternalDataSource | null;
};

function ExternalDataSourceEditDialog({
  open,
  onOpenChange,
  source,
}: ExternalDataSourceEditDialogProps) {
  const updateSource = useUpdateExternalDataSource();
  const { data: sourceDetail } = useExternalDataSource(source?.id ?? '');

  const typeItems = useMemo<ComboboxItem[]>(
    () =>
      (
        Object.entries(EXTERNAL_DATA_TYPE_LABELS) as [
          keyof typeof EXTERNAL_DATA_TYPE_LABELS,
          string,
        ][]
      ).map(([value, label]) => ({ label, value })),
    [],
  );

  const defaultValues: UpdateExternalDataSourceFormValues = {
    name: '',
    type: 'wholesale_prices',
    url: '',
    authConfigJson: '',
    isActive: true,
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateExternalDataSourceFormValues, unknown, UpdateExternalDataSourceInput>({
    resolver: zodResolver(updateExternalDataSourceSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open && sourceDetail) {
      reset({
        name: sourceDetail.name,
        type: sourceDetail.type,
        url: sourceDetail.url ?? '',
        authConfigJson: '',
        isActive: sourceDetail.isActive,
      });
    } else if (!open) {
      reset({
        name: '',
        type: 'wholesale_prices',
        url: '',
        authConfigJson: '',
        isActive: true,
      });
    }
  }, [open, sourceDetail, reset]);

  const onSubmit = (values: UpdateExternalDataSourceInput) => {
    if (!source) return;
    updateSource.mutate(
      { id: source.id, body: values },
      {
        onSuccess: () => {
          toast.success('Fuente externa actualizada');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  const typeValue = watch('type');
  const isActiveValue = watch('isActive');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset({
            name: '',
            type: 'wholesale_prices',
            url: '',
            authConfigJson: '',
            isActive: true,
          });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar fuente externa</DialogTitle>
          <DialogDescription>
            Modificá los datos de la fuente. El campo authConfig siempre arranca vacío (no podemos
            mostrar los valores originales por seguridad). Si lo dejás vacío, se mantiene el valor
            actual. Si lo editás, se reemplaza con el nuevo JSON.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-external-data-source-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-external-data-source-name">Nombre *</Label>
            <Input
              id="edit-external-data-source-name"
              autoComplete="off"
              autoFocus
              {...register('name')}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo *</Label>
            <ComboboxField
              label="Tipo"
              items={typeItems}
              value={typeValue ?? null}
              onValueChange={(v) => {
                if (v)
                  setValue('type', v as UpdateExternalDataSourceFormValues['type'], {
                    shouldValidate: true,
                  });
              }}
              placeholder="Seleccioná un tipo"
            />
            {typeValue ? (
              <div>
                <ExternalDataTypeBadge type={typeValue} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-external-data-source-url">URL</Label>
            <Input
              id="edit-external-data-source-url"
              type="url"
              autoComplete="off"
              placeholder="https://api.ejemplo.com/datos"
              {...register('url')}
            />
            {errors.url ? <p className="text-xs text-destructive">{errors.url.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-external-data-source-auth">Auth config (JSON)</Label>
            <Textarea
              id="edit-external-data-source-auth"
              rows={3}
              placeholder='Vacío = mantener. Nuevo JSON: {"headers": {...}, "queryParams": {...}}'
              {...register('authConfigJson')}
            />
            {errors.authConfigJson ? (
              <p className="text-xs text-destructive">{errors.authConfigJson.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Dejar vacío para mantener la auth actual. Pegar un JSON nuevo para reemplazarla.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-external-data-source-is-active"
              checked={isActiveValue ?? false}
              onCheckedChange={(checked) =>
                setValue('isActive', checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="edit-external-data-source-is-active" className="cursor-pointer">
              Activa
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-external-data-source-form"
              disabled={isSubmitting || updateSource.isPending}
            >
              {updateSource.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ExternalDataSourceEditDialog };
