import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type Provider, useCreateProvider } from '@/api/queries/use-providers';
import { Button } from '@/components/ui/button';
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
  type CreateProviderFormValues,
  type CreateProviderInput,
  createProviderSchema,
} from '@/lib/schemas/provider';

type ProviderCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (provider: Provider) => void;
};

function ProviderCreateDialog({ open, onOpenChange, onCreated }: ProviderCreateDialogProps) {
  const createProvider = useCreateProvider();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProviderFormValues>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: {
      name: '',
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        companyName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
  }, [open, reset]);

  const onSubmit = (values: CreateProviderFormValues) => {
    const input: CreateProviderInput = {
      name: values.name,
      ...(values.companyName ? { companyName: values.companyName } : {}),
      ...(values.contactName ? { contactName: values.contactName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
    };
    createProvider.mutate(
      { body: input },
      {
        onSuccess: (provider) => {
          toast.success('Proveedor creado');
          onOpenChange(false);
          onCreated?.(provider);
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
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider-name">Nombre *</Label>
            <Input id="provider-name" autoComplete="off" autoFocus {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provider-company">Razón social</Label>
              <Input id="provider-company" autoComplete="off" {...register('companyName')} />
              {errors.companyName ? (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provider-contact-name">Nombre de contacto</Label>
              <Input id="provider-contact-name" autoComplete="off" {...register('contactName')} />
              {errors.contactName ? (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provider-contact-email">Email de contacto</Label>
              <Input
                id="provider-contact-email"
                type="email"
                autoComplete="off"
                {...register('contactEmail')}
              />
              {errors.contactEmail ? (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provider-contact-phone">Teléfono de contacto</Label>
              <Input id="provider-contact-phone" autoComplete="off" {...register('contactPhone')} />
              {errors.contactPhone ? (
                <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createProvider.isPending}>
              {createProvider.isPending ? 'Creando…' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProviderCreateDialog };
