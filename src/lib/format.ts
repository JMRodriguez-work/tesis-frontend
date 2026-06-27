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
