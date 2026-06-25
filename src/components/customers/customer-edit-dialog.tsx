import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type Customer, useUpdateCustomer } from '@/api/queries/use-customers';
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
  type UpdateCustomerFormValues,
  type UpdateCustomerInput,
  updateCustomerSchema,
} from '@/lib/schemas/customer';

type CustomerEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
};

function CustomerEditDialog({ open, onOpenChange, customer }: CustomerEditDialogProps) {
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      fullname: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (open && customer) {
      reset({
        fullname: customer.fullname,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        address: customer.address ?? '',
      });
    }
  }, [open, customer, reset]);

  const onSubmit = (values: UpdateCustomerFormValues) => {
    if (!customer) return;
    const input: UpdateCustomerInput = {
      ...(values.fullname ? { fullname: values.fullname } : {}),
      email: values.email ? values.email : null,
      phone: values.phone ? values.phone : null,
      address: values.address ? values.address : null,
    };
    updateCustomer.mutate(
      { id: customer.id, body: input },
      {
        onSuccess: () => {
          toast.success('Cliente actualizado');
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
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-customer-fullname">Nombre completo *</Label>
            <Input
              id="edit-customer-fullname"
              autoComplete="off"
              autoFocus
              {...register('fullname')}
            />
            {errors.fullname ? (
              <p className="text-xs text-destructive">{errors.fullname.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-customer-email">Email</Label>
              <Input
                id="edit-customer-email"
                type="email"
                autoComplete="off"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-customer-phone">Teléfono</Label>
              <Input id="edit-customer-phone" autoComplete="off" {...register('phone')} />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-customer-address">Dirección</Label>
            <Textarea id="edit-customer-address" rows={2} {...register('address')} />
            {errors.address ? (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateCustomer.isPending}>
              {updateCustomer.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CustomerEditDialog };
