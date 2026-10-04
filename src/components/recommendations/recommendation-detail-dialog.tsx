import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useMe } from '@/api/queries/use-auth';
import {
  useRecommendation,
  useUpdateRecommendationStatus,
} from '@/api/queries/use-recommendations';
import { Skeleton } from '@/components/feedback/skeleton';
import { RecommendationPriorityBadge } from '@/components/recommendations/recommendation-priority-badge';
import { RecommendationStatusBadge } from '@/components/recommendations/recommendation-status-badge';
import { RecommendationTypeBadge } from '@/components/recommendations/recommendation-type-badge';
import { RestockOrderAction } from '@/components/recommendations/restock-order-action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mapApiError } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { roleFromId } from '@/lib/role';

type RecommendationDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationId: string | null;
};

function RecommendationDetailDialog({
  open,
  onOpenChange,
  recommendationId,
}: RecommendationDetailDialogProps) {
  const { data: me } = useMe();
  const role = roleFromId(me?.roleId ?? null);
  const canWrite = role === 'Admin' || role === 'Manager';

  const { data: recommendation, isLoading, error } = useRecommendation(recommendationId ?? '');
  const updateStatus = useUpdateRecommendationStatus();

  const handleUpdate = (newStatus: 'applied' | 'dismissed') => {
    if (!recommendationId) return;
    updateStatus.mutate(
      { id: recommendationId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'applied' ? 'Recomendación aplicada' : 'Recomendación descartada',
          );
          onOpenChange(false);
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle de la recomendación</DialogTitle>
          <DialogDescription>Información completa y acciones disponibles.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error || !recommendation ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            No se pudo cargar la recomendación.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <RecommendationTypeBadge type={recommendation.type} />
              <RecommendationPriorityBadge priority={recommendation.priority} />
              <RecommendationStatusBadge status={recommendation.status} />
            </div>

            <p className="text-xs text-foreground whitespace-pre-wrap">
              {recommendation.description}
            </p>

            <RestockOrderAction
              type={recommendation.type}
              itemId={recommendation.item?.id ?? null}
              disabled={updateStatus.isPending}
              onApply={() => handleUpdate('applied')}
            />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">Sucursal</dt>
              <dd>{recommendation.branch.name}</dd>
              <dt className="text-muted-foreground">Generada</dt>
              <dd>{formatDate(recommendation.generatedAt, true)}</dd>
              {recommendation.expiresAt ? (
                <>
                  <dt className="text-muted-foreground">Vence</dt>
                  <dd>{formatDate(recommendation.expiresAt, true)}</dd>
                </>
              ) : null}
              {recommendation.readAt ? (
                <>
                  <dt className="text-muted-foreground">Leída</dt>
                  <dd>{formatDate(recommendation.readAt, true)}</dd>
                </>
              ) : null}
              {recommendation.item ? (
                <>
                  <dt className="text-muted-foreground">Item</dt>
                  <dd>
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: recommendation.item.id }}
                      className="text-foreground hover:underline"
                    >
                      {recommendation.item.name}
                    </Link>
                  </dd>
                </>
              ) : null}
              {recommendation.customer ? (
                <>
                  <dt className="text-muted-foreground">Cliente</dt>
                  <dd>
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: recommendation.customer.id }}
                      className="text-foreground hover:underline"
                    >
                      {recommendation.customer.fullname}
                    </Link>
                  </dd>
                </>
              ) : null}
            </dl>
          </div>
        )}

        <DialogFooter>
          {recommendation && recommendation.status === 'pending' && canWrite ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleUpdate('dismissed')}
                disabled={updateStatus.isPending}
              >
                <XCircleIcon className="size-4" />
                Descartar
              </Button>
              <Button onClick={() => handleUpdate('applied')} disabled={updateStatus.isPending}>
                <CheckCircleIcon className="size-4" />
                Marcar aplicada
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RecommendationDetailDialog };
