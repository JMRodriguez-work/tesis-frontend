import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDetectInactiveCustomers } from '@/api/queries/use-customer-analytics';
import { Button } from '@/components/ui/button';
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
import { mapApiError } from '@/lib/api-error';
import {
  type DetectInactiveCustomersFormValues,
  detectInactiveCustomersSchema,
} from '@/lib/schemas/customer-analytics';

type DetectInactiveCustomersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
};

function DetectInactiveCustomersDialog({
  open,
  onOpenChange,
  branchId,
}: DetectInactiveCustomersDialogProps) {
  const detectInactive = useDetectInactiveCustomers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DetectInactiveCustomersFormValues>({
    resolver: zodResolver(detectInactiveCustomersSchema),
    defaultValues: { days: 60 },
  });

  useEffect(() => {
    if (open) reset({ days: 60 });
  }, [open, reset]);

  const onSubmit = handleSubmit((values) => {
    detectInactive.mutate(
      { days: values.days ?? 60, ...(branchId ? { branchId } : {}) },
      {
        onSuccess: (data) => {
          toast.success('Detección encolada', {
            description: `Los resultados aparecerán al refrescar. JobId: ${data.jobId.slice(0, 8)}…`,
          });
          onOpenChange(false);
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detectar clientes inactivos</DialogTitle>
          <DialogDescription>
            Esta acción analiza las compras de la sucursal activa y crea recomendaciones de tipo
            &quot;Retención&quot; para los clientes que no compran hace N días. El proceso corre en
            background; los resultados aparecerán al refrescar.
          </DialogDescription>
        </DialogHeader>
        <form id="detect-inactive-form" onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="days">Días sin comprar</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={365}
              step={1}
              autoComplete="off"
              {...register('days', { valueAsNumber: true })}
            />
            {errors.days ? (
              <p className="text-xs text-destructive">{errors.days.message}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Entre 1 y 365 días. Default: 60.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={detectInactive.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="detect-inactive-form"
              disabled={isSubmitting || detectInactive.isPending}
            >
              {detectInactive.isPending ? 'Encolando…' : 'Detectar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { DetectInactiveCustomersDialogProps };
export { DetectInactiveCustomersDialog };
