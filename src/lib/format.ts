const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

const decimal = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
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

export function formatDate(value: string | Date | null | undefined, long = false): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return (long ? dateLong : dateShort).format(date);
}
