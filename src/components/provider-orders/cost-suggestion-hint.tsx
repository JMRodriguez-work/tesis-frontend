import { LightbulbIcon } from '@phosphor-icons/react';
import {
  type ItemCostSuggestion,
  useItemOrderSuggestions,
} from '@/api/queries/use-items';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate, formatPeriodEs } from '@/lib/format';

type CostSuggestionHintProps = {
  itemId: string;
  /** Valor actual del input de costo: si el usuario ya escribió uno, no se sugiere. */
  currentCost: string;
  onApply: (cost: number) => void;
};

function buildExplanation(suggestion: ItemCostSuggestion): string {
  const suggested = formatCurrency(suggestion.suggestedCost);
  const variation = suggestion.ipimVariationPct;
  const sourceName = suggestion.ipimSourceName ?? 'INDEC';

  if (suggestion.lastCostSource === 'provider_order') {
    const base = `Último costo cargado: ${formatCurrency(suggestion.lastCost)} (orden del ${formatDate(suggestion.lastCostAt)}).`;
    if (variation === null) {
      return `${base} No hay datos de precios mayoristas para ajustarlo — sugerimos ${suggested} tal cual. Sugerencia editable.`;
    }
    const from = suggestion.ipimVariationFromPeriod ? formatPeriodEs(suggestion.ipimVariationFromPeriod) : null;
    const to = suggestion.ipimVariationToPeriod ? formatPeriodEs(suggestion.ipimVariationToPeriod) : null;
    if (variation === 0) {
      return `${base} Los precios mayoristas (${sourceName}) todavía no registran variación publicada desde esa compra — sugerimos ${suggested}. Sugerencia editable.`;
    }
    const sign = variation > 0 ? 'subieron' : 'bajaron';
    const pct = `${Math.abs(variation).toFixed(1)}%`;
    const window = from && to ? ` según la variación ${from} → ${to}` : '';
    return `${base} Precios mayoristas (${sourceName}): ${sign} ${pct}${window}. Sugerimos ${suggested}. Sugerencia editable — dejala en lo que coteje tu proveedor.`;
  }

  // Sin órdenes registradas: ancla = precio de compra de la ficha.
  const base = `Este producto no tiene órdenes registradas: usé el precio de compra de la ficha (${formatCurrency(suggestion.lastCost)}).`;
  if (variation === null || variation === 0) {
    return `${base} Sin variación de precios mayoristas aplicable — sugerimos ${suggested}. Sugerencia editable.`;
  }
  const sign = variation > 0 ? 'subieron' : 'bajaron';
  const pct = `${Math.abs(variation).toFixed(1)}%`;
  return `${base} Los precios mayoristas (${sourceName}) ${sign} ${pct} el último mes. Sugerimos ${suggested}. Sugerencia editable.`;
}

/**
 * Hint bajo el input de costo de una fila de orden a proveedor: propone el
 * último costo registrado ajustado por la variación mayorista del INDEC.
 * Solo aparece si el usuario todavía no escribió un costo. Si el item no
 * tiene datos (nunca se compró y no tiene precio de ficha), no se renderiza.
 */
function CostSuggestionHint({ itemId, currentCost, onApply }: CostSuggestionHintProps) {
  const hasCost = currentCost.trim() !== '';
  const { data } = useItemOrderSuggestions(hasCost ? '' : itemId);
  const suggestion = data?.costSuggestion ?? null;

  if (!suggestion) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onApply(suggestion.suggestedCost)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand-600 hover:underline"
              aria-label="Aplicar costo sugerido"
            >
              <LightbulbIcon className="size-3" weight="fill" />
              Sugerido: {formatCurrency(suggestion.suggestedCost)}
            </button>
          }
        />
        <TooltipContent className="max-w-72">
          <p className="text-[11px] leading-relaxed">{buildExplanation(suggestion)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { CostSuggestionHint };
