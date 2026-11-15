import { TrendUpIcon } from '@phosphor-icons/react';
import { useExternalDataSources } from '@/api/queries/use-external-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type WholesalePricePayload = {
  source?: string;
  latest?: { period?: string; value?: number | string };
  latestChange?: number | string | null;
};

function WholesalePriceContext() {
  const { data } = useExternalDataSources({ limit: 1, type: 'wholesale_prices' });

  const payload = (() => {
    const row = data?.data[0];
    if (!row || typeof row.data !== 'object' || row.data === null) return null;
    const obj = row.data as { payload?: WholesalePricePayload };
    return obj.payload ?? null;
  })();

  const change = payload?.latestChange;
  const changeNum = typeof change === 'string' ? Number(change) : change;
  if (typeof changeNum !== 'number' || Number.isNaN(changeNum)) return null;

  const sign = changeNum >= 0 ? '+' : '';

  return (
    <Alert>
      <TrendUpIcon />
      <div className="flex-1">
        <AlertTitle>
          Contexto de precios mayoristas: {sign}
          {changeNum.toFixed(1)}%
        </AlertTitle>
        <AlertDescription>
          Variación mensual de los precios al por mayor según el INDEC. Si el porcentaje
          sigue subiendo, lo que repongas hoy te cuesta menos que mañana: definí el costo
          de la orden con eso en cuenta.
        </AlertDescription>
      </div>
    </Alert>
  );
}

export { WholesalePriceContext };
