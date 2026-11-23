const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

const decimal = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const count = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const weight = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const volume = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const dateShort = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateLong = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export type QuantityUnitType = 'count' | 'weight' | 'volume' | null | undefined;

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return currency.format(num);
}

export function formatDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return decimal.format(num);
}

/**
 * Formatea una cantidad de stock respetando el tipo de unidad del item.
 * - `count` (Unidad, Docena, Caja) → entero (0 decimales).
 * - `weight` (Kilogramo, Gramo) → hasta 3 decimales.
 * - `volume` (Litro, Mililitro) → hasta 3 decimales.
 * - `null`/`undefined` → sin info, usa formato genérico (hasta 4 decimales).
 *
 * Si querés formatear valores que ya sabés que son `count` sin tener el item
 * a mano (ej. inputs de stock-movements), pasá `unitType: 'count'`.
 */
export function formatQuantity(
  value: number | string | null | undefined,
  unitType?: QuantityUnitType,
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  if (unitType === 'count') return count.format(num);
  if (unitType === 'weight') return weight.format(num);
  if (unitType === 'volume') return volume.format(num);
  return decimal.format(num);
}

export function formatDate(value: string | Date | null | undefined, long = false): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return (long ? dateLong : dateShort).format(date);
}

const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Convierte un período de la serie INDEC ("2026-09-01" o "2026-09") en
 * texto legible: "septiembre 2026". Si no matchea, devuelve el string
 * original sin tocarlo.
 */
export function formatPeriodEs(period: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(period);
  if (!match) return period;
  const monthName = MONTH_NAMES_ES[Number(match[2]) - 1];
  if (!monthName) return period;
  return `${monthName} ${match[1]}`;
}

/** Número de mes (1-12) → nombre en español. Devuelve "—" si está fuera de rango. */
export function monthNameEs(month: number): string {
  return MONTH_NAMES_ES[month - 1] ?? '—';
}

/**
 * Nota de frescura del dato del INDEC: los índices se publican con demora
 * (aprox. 2 meses), así que en noviembre el último dato disponible es
 * septiembre. Sin esta nota, ver "ago → sep" en noviembre parece dato viejo
 * aunque sea el más nuevo que existe. Devuelve null si el dato está al día.
 *
 * Es información técnica: solo se muestra en la vista de administración de
 * fuentes ("Ver datos"), nunca en los flujos de compra/venta.
 */
export function indecFreshnessNote(latestPeriod: string | null | undefined): string | null {
  if (!latestPeriod) return null;
  const match = /^(\d{4})-(\d{2})/.exec(latestPeriod);
  if (!match) return null;
  const now = new Date();
  const monthsBehind =
    (now.getFullYear() - Number(match[1])) * 12 +
    (now.getMonth() + 1 - Number(match[2]));
  if (monthsBehind < 1) return null;
  const lag = monthsBehind === 1 ? '~1 mes' : `~${monthsBehind} meses`;
  return `El INDEC publica los índices con ${lag} de demora (último dato: ${formatPeriodEs(latestPeriod)}).`;
}
