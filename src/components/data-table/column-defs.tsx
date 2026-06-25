import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatDecimal } from '@/lib/format';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';

function textColumn<T>(header: string, accessor: keyof T, fallback = '—'): ColumnDef<T, unknown> {
  return {
    id: String(accessor),
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined || value === '') return fallback;
      return String(value);
    },
  };
}

function badgeColumn<T>(
  header: string,
  accessor: keyof T,
  variant: BadgeVariant = 'default',
  fallback = '—',
): ColumnDef<T, unknown> {
  return {
    id: `badge-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return fallback;
      return <Badge variant={variant}>{String(value)}</Badge>;
    },
  };
}

function dateColumn<T>(
  header: string,
  accessor: keyof T,
  long = false,
  fallback = '—',
): ColumnDef<T, unknown> {
  return {
    id: `date-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => formatDate(getValue() as string | Date | null, long) ?? fallback,
  };
}

function currencyColumn<T>(
  header: string,
  accessor: keyof T,
  fallback = '—',
): ColumnDef<T, unknown> {
  return {
    id: `currency-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => formatCurrency(getValue() as number | string | null) ?? fallback,
  };
}

function numberColumn<T>(header: string, accessor: keyof T, fallback = '—'): ColumnDef<T, unknown> {
  return {
    id: `number-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => formatDecimal(getValue() as number | string | null) ?? fallback,
  };
}

type BooleanColumnOptions = {
  trueLabel?: string;
  falseLabel?: string;
  trueVariant?: BadgeVariant;
  falseVariant?: BadgeVariant;
  fallback?: string;
};

function booleanColumn<T>(
  header: string,
  accessor: keyof T,
  options: BooleanColumnOptions = {},
  fallback?: string,
): ColumnDef<T, unknown> {
  const {
    trueLabel = 'Sí',
    falseLabel = 'No',
    trueVariant = 'default',
    falseVariant = 'secondary',
    fallback: optFallback,
  } = options;
  const realFallback = optFallback ?? fallback ?? '—';
  return {
    id: `bool-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return realFallback;
      return value ? (
        <Badge variant={trueVariant}>{trueLabel}</Badge>
      ) : (
        <Badge variant={falseVariant}>{falseLabel}</Badge>
      );
    },
  };
}

function iconColumn<T>(
  header: string,
  accessor: keyof T,
  renderIcon: (value: unknown) => ReactNode,
  fallback = '—',
): ColumnDef<T, unknown> {
  return {
    id: `icon-${String(accessor)}`,
    header,
    accessorFn: (row) => row[accessor],
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return fallback;
      return renderIcon(value);
    },
  };
}

function actionsColumn<T>(
  header: string,
  renderActions: (row: T) => ReactNode,
): ColumnDef<T, unknown> {
  return {
    id: 'actions',
    header,
    cell: ({ row }) => renderActions(row.original),
  };
}

export type { BadgeVariant, BooleanColumnOptions };
export {
  actionsColumn,
  badgeColumn,
  booleanColumn,
  currencyColumn,
  dateColumn,
  iconColumn,
  numberColumn,
  textColumn,
};
