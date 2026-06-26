import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type ExternalDataSource,
  useDeleteExternalDataSource,
} from '@/api/queries/use-external-data';
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

type ExternalDataSourceDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ExternalDataSource | null;
};

function ExternalDataSourceDeleteDialog({
  open,
  onOpenChange,
  source,
}: ExternalDataSourceDeleteDialogProps) {
  const deleteSource = useDeleteExternalDataSource();

  const confirmSchema = useMemo(
    () =>
      z.object({
        confirmName: z.string().refine((val) => val === source?.name, {
          message: 'El nombre no coincide',
        }),
      }),
    [source?.name],
  );

  type FormValues = z.infer<typeof confirmSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirmName: '' },
  });

  useEffect(() => {
    if (open) reset({ confirmName: '' });
  }, [open, reset]);

  const onSubmit = () => {
    if (!source) return;
    deleteSource.mutate(source.id, {
      onSuccess: () => {
        toast.success('Fuente eliminada');
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset({ confirmName: '' });
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar fuente externa</DialogTitle>
          <DialogDescription>
            Esta acción deshabilita la fuente. El sistema dejará de intentar hacer fetch de su URL.
            <br />
            Para confirmar, escribí el nombre exacto de la fuente: <strong>{source?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          id="delete-external-data-source-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-external-data-source-confirm">Nombre de la fuente</Label>
            <Input
              id="delete-external-data-source-confirm"
              autoComplete="off"
              {...register('confirmName')}
            />
            {errors.confirmName ? (
              <p className="text-xs text-destructive">{errors.confirmName.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="delete-external-data-source-form"
              variant="destructive"
              disabled={isSubmitting || deleteSource.isPending}
            >
              {deleteSource.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ExternalDataSourceDeleteDialog };
