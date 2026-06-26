import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ExternalDataSource,
  useCreateExternalDataSource,
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
  type CreateExternalDataSourceFormValues,
  type CreateExternalDataSourceInput,
  createExternalDataSourceSchema,
} from '@/lib/schemas/external-data';
import { EXTERNAL_DATA_TYPE_LABELS, ExternalDataTypeBadge } from './external-data-type-badge';

type ExternalDataSourceCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (source: ExternalDataSource) => void;
};

function ExternalDataSourceCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ExternalDataSourceCreateDialogProps) {
  const createSource = useCreateExternalDataSource();

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

  const defaultValues: CreateExternalDataSourceFormValues = {
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
  } = useForm<CreateExternalDataSourceFormValues, unknown, CreateExternalDataSourceInput>({
    resolver: zodResolver(createExternalDataSourceSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        type: 'wholesale_prices',
        url: '',
        authConfigJson: '',
        isActive: true,
      });
    }
  }, [open, reset]);

  const onSubmit = (values: CreateExternalDataSourceInput) => {
    createSource.mutate(
      { body: values },
      {
        onSuccess: (source) => {
          toast.success('Fuente externa creada');
          onOpenChange(false);
          onCreated?.(source);
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
          <DialogTitle>Nueva fuente externa</DialogTitle>
          <DialogDescription>
            Configurá una fuente de datos externos (precios mayoristas, tendencias de búsqueda o
            estacionalidad). El sistema intentará hacer fetch diario de la URL.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-external-data-source-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="external-data-source-name">Nombre *</Label>
            <Input
              id="external-data-source-name"
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
              value={typeValue}
              onValueChange={(v) => {
                if (v)
                  setValue('type', v as CreateExternalDataSourceFormValues['type'], {
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
            <Label htmlFor="external-data-source-url">URL</Label>
            <Input
              id="external-data-source-url"
              type="url"
              autoComplete="off"
              placeholder="https://api.ejemplo.com/datos"
              {...register('url')}
            />
            {errors.url ? <p className="text-xs text-destructive">{errors.url.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="external-data-source-auth">Auth config (JSON)</Label>
            <Textarea
              id="external-data-source-auth"
              rows={3}
              placeholder='Ej: {"headers": {"X-API-Key": "..."}, "queryParams": {"key": "..."}}'
              {...register('authConfigJson')}
            />
            {errors.authConfigJson ? (
              <p className="text-xs text-destructive">{errors.authConfigJson.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Si la fuente requiere autenticación, pegá el JSON con headers y/o queryParams. Vacío
                = sin auth.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="external-data-source-is-active"
              checked={isActiveValue}
              onCheckedChange={(checked) =>
                setValue('isActive', checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="external-data-source-is-active">Activa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-external-data-source-form"
              disabled={isSubmitting || createSource.isPending}
            >
              {createSource.isPending ? 'Creando…' : 'Crear fuente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ExternalDataSourceCreateDialog };
