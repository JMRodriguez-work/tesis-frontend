import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCompleteOnboarding } from '@/api/queries/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import { type OnboardingInput, onboardingSchema } from '@/lib/schemas/auth';

const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      branchName: '',
      warehouseName: '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    const body: OnboardingInput = {
      organizationName: values.organizationName,
      branchName: values.branchName,
      ...(values.warehouseName && values.warehouseName.length > 0
        ? { warehouseName: values.warehouseName }
        : {}),
    };
    completeOnboarding.mutate(body, {
      onSuccess: () => {
        toast.success('¡Listo! Tu organización está configurada.');
        void navigate({ to: '/dashboard' });
      },
      onError: (err) => {
        toast.error(mapApiError(err).message);
      },
    });
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Configurar organización</h1>
          <p className="text-xs text-muted-foreground">
            Creamos tu primera organización, sucursal y depósito. Después podés agregar más.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationName">Nombre de la organización</Label>
          <Input
            id="organizationName"
            type="text"
            placeholder="Ej: Almacén del Sur"
            {...register('organizationName')}
          />
          {errors.organizationName ? (
            <p className="text-xs text-destructive">{errors.organizationName.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="branchName">Nombre de la sucursal</Label>
          <Input
            id="branchName"
            type="text"
            placeholder="Ej: Casa central"
            {...register('branchName')}
          />
          {errors.branchName ? (
            <p className="text-xs text-destructive">{errors.branchName.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="warehouseName">
            Nombre del depósito{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="warehouseName"
            type="text"
            placeholder="Ej: Depósito Principal"
            {...register('warehouseName')}
          />
          {errors.warehouseName ? (
            <p className="text-xs text-destructive">{errors.warehouseName.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting || completeOnboarding.isPending}>
          {completeOnboarding.isPending ? 'Creando…' : 'Continuar'}
        </Button>
      </form>
    </main>
  );
}

export { Route };
