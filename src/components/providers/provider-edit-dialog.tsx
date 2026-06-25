import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type Provider, useUpdateProvider } from '@/api/queries/use-providers';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import {
  type UpdateProviderFormValues,
  type UpdateProviderInput,
  updateProviderSchema,
} from '@/lib/schemas/provider';

type ProviderEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider | null;
};

function ProviderEditDialog({ open, onOpenChange, provider }: ProviderEditDialogProps) {
  const updateProvider = useUpdateProvider();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProviderFormValues>({
    resolver: zodResolver(updateProviderSchema),
    defaultValues: {
      name: '',
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open && provider) {
      reset({
        name: provider.name,
        companyName: provider.companyName ?? '',
        contactName: provider.contactName ?? '',
        contactEmail: provider.contactEmail ?? '',
        contactPhone: provider.contactPhone ?? '',
        isActive: provider.isActive,
      });
    }
  }, [open, provider, reset]);

  const onSubmit = (values: UpdateProviderFormValues) => {
    if (!provider) return;
    const input: UpdateProviderInput = {
      ...(values.name ? { name: values.name } : {}),
      companyName: values.companyName ? values.companyName : null,
      contactName: values.contactName ? values.contactName : null,
      contactEmail: values.contactEmail ? values.contactEmail : null,
      contactPhone: values.contactPhone ? values.contactPhone : null,
      isActive: values.isActive ?? true,
    };
    updateProvider.mutate(
      { id: provider.id, body: input },
      {
        onSuccess: () => {
          toast.success('Proveedor actualizado');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-provider-name">Nombre *</Label>
            <Input id="edit-provider-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-provider-company">Razón social</Label>
              <Input id="edit-provider-company" autoComplete="off" {...register('companyName')} />
              {errors.companyName ? (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-provider-contact-name">Nombre de contacto</Label>
              <Input
                id="edit-provider-contact-name"
                autoComplete="off"
                {...register('contactName')}
              />
              {errors.contactName ? (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-provider-contact-email">Email de contacto</Label>
              <Input
                id="edit-provider-contact-email"
                type="email"
                autoComplete="off"
                {...register('contactEmail')}
              />
              {errors.contactEmail ? (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-provider-contact-phone">Teléfono de contacto</Label>
              <Input
                id="edit-provider-contact-phone"
                autoComplete="off"
                {...register('contactPhone')}
              />
              {errors.contactPhone ? (
                <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-provider-active"
              checked={Boolean(watch('isActive'))}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-provider-active" className="cursor-pointer">
              Activo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateProvider.isPending}>
              {updateProvider.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderEditDialog };
