import { TrendUpIcon } from '@phosphor-icons/react';
import { useExternalDataSources } from '@/api/queries/use-external-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type WholesalePricePayload = {
  source?: string;
  latest?: { period?: string; value?: number | string };
  latestChange?: number | string | null;
};

/**
 * Contexto de precios mayoristas (fuente INDEC IPIM) para la pantalla de
 * compra. Igual que el backend al enricher recomendaciones: si la fuente
 * todavía no tiene datos, falló la consulta o el usuario no puede leerla,
 * el banner simplemente no se muestra — la compra nunca se bloquea por el
 * dato externo.
 *
 * Copys en lenguaje de negocio a propósito: fechas de publicación y ventanas
 * del índice viven en Configuración → Datos externos ("Ver datos"), la vista
 * técnica. Acá el usuario solo necesita el número y qué hacer con él.
 */
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
          Precios mayoristas: {sign}
          {changeNum.toFixed(1)}% el último mes medido
        </AlertTitle>
        <AlertDescription>
          Si la variación sigue subiendo, lo que repongas hoy te cuesta menos que mañana.
        </AlertDescription>
      </div>
    </Alert>
  );
}

export { WholesalePriceContext };
