import { type ExternalDataSource, useExternalDataSource } from '@/api/queries/use-external-data';
import { Skeleton } from '@/components/feedback/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';

type ExternalDataViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ExternalDataSource | null;
};

type IpcPayload = {
  source?: string;
  latest?: { period?: string; value?: number | string };
  latestChange?: number | string;
  series?: { period?: string; value?: number | string }[];
};

type SeasonalityPayload = {
  peaks?: { month?: string; category?: string; intensity?: number | string }[];
};

function ExternalDataViewDialog({ open, onOpenChange, source }: ExternalDataViewDialogProps) {
  const { data: detail, isLoading, error } = useExternalDataSource(source?.id ?? '');

  const payload = (() => {
    if (!detail?.data || typeof detail.data !== 'object') return null;
    const obj = detail.data as Record<string, unknown>;
    if (obj.type !== 'wholesale_prices' && obj.type !== 'seasonality') return obj;
    return obj.payload as Record<string, unknown> | undefined;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Datos obtenidos - {source?.name}</DialogTitle>
          <DialogDescription>
            {detail?.lastFetchedAt
              ? `Última consulta: ${formatDate(detail.lastFetchedAt, true)}`
              : 'Esta fuente todavía no recibió datos.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error || !detail ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            No se pudo cargar el detalle de la fuente.
          </div>
        ) : detail.lastError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            La última consulta terminó con error: {detail.lastError}
          </div>
        ) : !payload ? (
          <p className="text-xs text-muted-foreground">Sin datos registrados todavía.</p>
        ) : detail.type === 'wholesale_prices' ? (
          <IpcDataView payload={payload as IpcPayload} />
        ) : detail.type === 'seasonality' ? (
          <SeasonalityView payload={payload as SeasonalityPayload} />
        ) : (
          <pre className="max-h-64 overflow-auto rounded-none border border-border bg-slate-50 p-3 font-mono text-[11px]">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}

function IpcDataView({ payload }: { payload: IpcPayload }) {
  const change = payload.latestChange;
  const changeNum = typeof change === 'string' ? Number(change) : change;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-4 rounded-none border border-border bg-slate-50 p-3">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">
            ÚLTIMO PERÍODO {payload.latest?.period ? `· ${payload.latest.period}` : ''}
          </p>
          <p className="text-lg font-semibold">{payload.latest?.value ?? '—'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-[11px] text-muted-foreground">VAR. MENSUAL</p>
          <p
            className={
              typeof changeNum === 'number' && changeNum > 0
                ? 'text-lg font-semibold text-red-600'
                : 'text-lg font-semibold'
            }
          >
            {typeof changeNum === 'number'
              ? `${changeNum > 0 ? '+' : ''}${changeNum.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">
        {payload.source ?? 'Fuente'} · serie índice, base dic-2016 = 100
      </p>
      {payload.series && payload.series.length > 0 ? (
        <div className="rounded-none border border-border">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Período</th>
                <th className="p-2 text-right font-medium">Índice</th>
              </tr>
            </thead>
            <tbody>
              {payload.series.slice(-6).map((point) => (
                <tr key={point.period} className="border-b last:border-0">
                  <td className="p-2 font-mono">{point.period}</td>
                  <td className="p-2 text-right font-mono">{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Este contexto alimenta la prioridad y la justificación de las recomendaciones de
        reabastecimiento.
      </p>
    </div>
  );
}

function SeasonalityView({ payload }: { payload: SeasonalityPayload }) {
  const peaks = payload.peaks ?? [];
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] text-muted-foreground">
        CALENDARIO ESTACIONAL · {peaks.length} picos configurados
      </p>
      <div className="rounded-none border border-border">
        <table className="w-full text-xs">
          <thead className="border-b bg-slate-50 text-left text-muted-foreground">
            <tr>
              <th className="p-2 font-medium">Mes</th>
              <th className="p-2 font-medium">Categoría</th>
              <th className="p-2 text-right font-medium">Intensidad</th>
            </tr>
          </thead>
          <tbody>
            {peaks.map((peak) => (
              <tr key={`${peak.month}-${peak.category}`} className="border-b last:border-0">
                <td className="p-2 font-mono">{peak.month}</td>
                <td className="p-2">{peak.category}</td>
                <td className="p-2 text-right font-mono">
                  {typeof peak.intensity === 'number'
                    ? `${Math.round(peak.intensity * 100)}%`
                    : peak.intensity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Los picos del mes en curso generan recomendaciones estacionales por producto.
      </p>
    </div>
  );
}

export { ExternalDataViewDialog };
