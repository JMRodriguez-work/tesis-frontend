import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSignIn } from '@/api/queries/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import { type SignInInput, signInSchema } from '@/lib/schemas/auth';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    signIn.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          void navigate({ to: redirect || '/dashboard' });
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
        },
      },
    );
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Iniciar sesión</h1>
          <p className="text-xs text-muted-foreground">Ingresá con tu email y contraseña.</p>
        </header>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                toast.info('Función disponible próximamente.');
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting || signIn.isPending}>
          {signIn.isPending ? 'Ingresando…' : 'Ingresar'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link
            to="/signup"
            search={{ redirect }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </form>
    </main>
  );
}

export { Route };
