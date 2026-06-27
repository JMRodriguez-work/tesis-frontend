import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSignUp } from '@/api/queries/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import { type SignUpInput, signUpSchema } from '@/lib/schemas/auth';

const signupSearchSchema = z.object({
  redirect: z.string().optional(),
});

const Route = createFileRoute('/signup')({
  validateSearch: signupSearchSchema,
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    signUp.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onSuccess: () => {
          void navigate({ to: '/onboarding' });
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
          <h1 className="text-lg font-semibold">Crear cuenta</h1>
          <p className="text-xs text-muted-foreground">
            Empezás sin organización: el próximo paso es configurar la tuya.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            {...register('name')}
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting || signUp.isPending}>
          {signUp.isPending ? 'Creando…' : 'Crear cuenta'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            search={{ redirect }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}

export { Route };
