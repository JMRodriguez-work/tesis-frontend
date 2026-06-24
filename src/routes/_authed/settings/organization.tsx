import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import { useOrganization, useUpdateOrganization } from '@/api/queries/use-organizations';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapApiError } from '@/lib/api-error';
import { roleFromId } from '@/lib/role';
import { type UpdateOrganizationInput, updateOrganizationSchema } from '@/lib/schemas/organization';

const Route = createFileRoute('/_authed/settings/organization')({
  component: OrganizationPage,
});

function OrganizationPage() {
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canEdit = role === 'Admin';
  const organizationId = me?.organizationId ?? '';
  const { data: organization, isLoading } = useOrganization(organizationId);
  const updateOrganization = useUpdateOrganization();
  const [submitting, setSubmitting] = useState(false);

  type FormValues = { name: string };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateOrganizationSchema) as Resolver<FormValues>,
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (organization) {
      reset({ name: organization.name });
    }
  }, [organization, reset]);

  const onSubmit = (values: FormValues) => {
    if (!organizationId) return;
    setSubmitting(true);
    const body: UpdateOrganizationInput = { name: values.name };
    updateOrganization.mutate(
      { id: organizationId, body },
      {
        onSuccess: () => {
          toast.success('Organización actualizada');
          setSubmitting(false);
        },
        onError: (err) => {
          toast.error(mapApiError(err).message);
          setSubmitting(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header>
        <h1 className="text-lg font-semibold">Organización</h1>
        <p className="text-xs text-muted-foreground">
          Datos del comercio al que pertenece tu cuenta.
        </p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información general</CardTitle>
          <CardDescription>
            {canEdit
              ? 'Editá el nombre del comercio. El cambio se aplica a todos los miembros.'
              : 'Solo un administrador puede editar esta información.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="organization-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organization-name">Nombre *</Label>
              <Input
                id="organization-name"
                autoComplete="off"
                disabled={!canEdit}
                {...register('name')}
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                form="organization-form"
                disabled={!canEdit || submitting || updateOrganization.isPending}
              >
                {updateOrganization.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { Route };
