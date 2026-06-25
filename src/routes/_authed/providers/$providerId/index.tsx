import { ArrowLeftIcon, PencilSimpleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMe } from '@/api/queries/use-auth';
import { useProvider } from '@/api/queries/use-providers';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { ProviderDeleteDialog } from '@/components/providers/provider-delete-dialog';
import { ProviderEditDialog } from '@/components/providers/provider-edit-dialog';
import { ProviderStatusBadge } from '@/components/providers/provider-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';
import { cn } from '@/lib/utils';

const Route = createFileRoute('/_authed/providers/$providerId/')({
  component: ProviderDetailPage,
});

function ProviderDetailPage() {
  const { providerId } = Route.useParams();
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';
  const canDelete = role === 'Admin';

  const { data: provider, isLoading, error, refetch } = useProvider(providerId);

  const [editing, setEditing] = useState(false);
  const [toDelete, setToDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-6">
        <ErrorState
          error={error ?? new Error('Proveedor no encontrado')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/providers"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{provider.name}</h1>
          <ProviderStatusBadge isActive={provider.isActive} />
        </div>
        {canWrite || canDelete ? (
          <div className="flex items-center gap-1">
            {canWrite ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilSimpleIcon className="size-3.5" />
                Editar
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setToDelete(true)}>
                <TrashIcon className="size-3.5" />
                Eliminar
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {!provider.isActive ? (
        <Alert variant="warning">
          <WarningIcon weight="fill" />
          <div>
            <AlertTitle>Proveedor inactivo</AlertTitle>
            <AlertDescription>
              Este proveedor fue dado de baja. Reactiválo desde Editar para volver a usarlo.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Información general</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Razón social</dt>
          <dd>{provider.companyName ?? '—'}</dd>
          <dt className="text-muted-foreground">Nombre de contacto</dt>
          <dd>{provider.contactName ?? '—'}</dd>
          <dt className="text-muted-foreground">Email de contacto</dt>
          <dd>{provider.contactEmail ?? '—'}</dd>
          <dt className="text-muted-foreground">Teléfono de contacto</dt>
          <dd>{provider.contactPhone ?? '—'}</dd>
          <dt className="text-muted-foreground">Creado</dt>
          <dd>{formatDate(provider.createdAt, true)}</dd>
          <dt className="text-muted-foreground">Actualizado</dt>
          <dd>{formatDate(provider.updatedAt, true)}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
        Las órdenes de este proveedor se mostrarán cuando esté implementado (Sprint 2.2, HU-018).
      </section>

      <ProviderEditDialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
        provider={provider}
      />
      <ProviderDeleteDialog
        open={toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(false);
        }}
        provider={provider}
      />
    </div>
  );
}

export { Route };
