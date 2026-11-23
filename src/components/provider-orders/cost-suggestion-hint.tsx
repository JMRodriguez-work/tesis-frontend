import { LightbulbIcon } from '@phosphor-icons/react';
import {
  type ItemCostSuggestion,
  useItemOrderSuggestions,
} from '@/api/queries/use-items';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/format';

type CostSuggestionHintProps = {
  itemId: string;
  /** Valor actual del input de costo: si el usuario ya escribió uno, no se sugiere. */
  currentCost: string;
  onApply: (cost: number) => void;
};

type SuggestionRow = { label: string; value: string };

/**
 * Filas del tooltip en lenguaje de negocio: qué costó la última vez, cuánto
 * movieron los precios mayoristas y cuánto costaría hoy. Sin fechas del
 * INDEC ni notas de publicación — eso vive en Configuración → Datos
 * externos ("Ver datos"), la vista técnica.
 */
function buildRows(suggestion: ItemCostSuggestion): SuggestionRow[] {
  const variation = suggestion.ipimVariationPct;
  let variationLabel: string;
  if (variation === null) {
    variationLabel = 'sin datos';
  } else if (variation === 0) {
    variationLabel = 'sin variación';
  } else {
    const sign = variation > 0 ? '+' : '−';
    const basis =
      suggestion.lastCostSource === 'provider_order' &&
      suggestion.lastCostAt &&
      suggestion.ipimVariationFromPeriod &&
      suggestion.ipimVariationFromPeriod.slice(0, 7) < suggestion.lastCostAt.slice(0, 7)
        ? 'desde tu última compra'
        : 'el último mes medido';
    variationLabel = `${sign}${Math.abs(variation).toFixed(1)}% ${basis}`;
  }

  const lastCostLabel =
    suggestion.lastCostSource === 'provider_order' && suggestion.lastCostAt
      ? `${formatCurrency(suggestion.lastCost)} (${formatDate(suggestion.lastCostAt)})`
      : formatCurrency(suggestion.lastCost);

  return [
    { label: 'La última vez', value: lastCostLabel },
    { label: 'Mayoristas', value: variationLabel },
    { label: 'Hoy', value: `${formatCurrency(suggestion.suggestedCost)} · ajustable` },
  ];
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

  const rows = buildRows(suggestion);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onApply(suggestion.suggestedCost)}
              className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:underline"
              aria-label="Aplicar costo sugerido"
            >
              <LightbulbIcon className="size-3" weight="fill" />
              Sugerido: {formatCurrency(suggestion.suggestedCost)}
            </button>
          }
        />
        <TooltipContent className="max-w-72">
          <div className="flex flex-col gap-1.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4">
                <span className="shrink-0 text-[11px] text-muted-foreground">{row.label}</span>
                <span className="text-right text-[11px]">{row.value}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { CostSuggestionHint };
