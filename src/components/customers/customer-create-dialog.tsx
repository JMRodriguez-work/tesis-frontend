import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type Customer, useCreateCustomer } from '@/api/queries/use-customers';
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
import { Textarea } from '@/components/ui/textarea';
import { mapApiError } from '@/lib/api-error';
import {
  type CreateCustomerFormValues,
  type CreateCustomerInput,
  createCustomerSchema,
} from '@/lib/schemas/customer';

type CustomerCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  onCreated?: (customer: Customer) => void;
};

function CustomerCreateDialog({
  open,
  onOpenChange,
  branchId,
  onCreated,
}: CustomerCreateDialogProps) {
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      fullname: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullname: '',
        email: '',
        phone: '',
        address: '',
      });
    }
  }, [open, reset]);

  const onSubmit = (values: CreateCustomerFormValues) => {
    const input: CreateCustomerInput = {
      fullname: values.fullname,
      ...(values.email ? { email: values.email } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.address ? { address: values.address } : {}),
    };
    createCustomer.mutate(
      { body: input, branchId },
      {
        onSuccess: (customer) => {
          toast.success('Cliente creado');
          onOpenChange(false);
          onCreated?.(customer);
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
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-fullname">Nombre completo *</Label>
            <Input id="customer-fullname" autoComplete="off" autoFocus {...register('fullname')} />
            {errors.fullname ? (
              <p className="text-xs text-destructive">{errors.fullname.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" type="email" autoComplete="off" {...register('email')} />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input id="customer-phone" autoComplete="off" {...register('phone')} />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-address">Dirección</Label>
            <Textarea id="customer-address" rows={2} {...register('address')} />
            {errors.address ? (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createCustomer.isPending}>
              {createCustomer.isPending ? 'Creando…' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CustomerCreateDialog };
