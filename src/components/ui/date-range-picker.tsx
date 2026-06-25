import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DateRange = {
  from?: Date;
  to?: Date;
};

const dateLong = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDateLabel(d: Date | undefined): string {
  if (!d) return '—';
  return dateLong.format(d);
}

function toStartOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function toISODate(d: Date | undefined | null): string | null {
  if (!d) return null;
  return toStartOfDay(d).toISOString();
}

export function parseISODate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
};

function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccioná un rango',
  className,
  disabled,
  align = 'start',
}: DateRangePickerProps) {
  const hasValue = Boolean(value.from) || Boolean(value.to);
  const label = useMemo(() => {
    if (!value.from && !value.to) return placeholder;
    return `${formatDateLabel(value.from)} → ${formatDateLabel(value.to)}`;
  }, [value.from, value.to, placeholder]);

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={disabled}
              className={cn(
                'min-w-72 justify-start gap-2 px-2.5 font-normal',
                !hasValue && 'text-muted-foreground',
              )}
            >
              <CalendarBlankIcon className="size-4" />
              <span className="truncate text-xs">{label}</span>
            </Button>
          }
        />
        <PopoverContent align={align} className="w-auto p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Desde
              </span>
              <Calendar
                mode="single"
                selected={value.from}
                onSelect={(d) => onChange({ ...value, from: d ?? undefined })}
                disabled={(d) => (value.to ? d > value.to : false)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Hasta
              </span>
              <Calendar
                mode="single"
                selected={value.to}
                onSelect={(d) => onChange({ ...value, to: d ?? undefined })}
                disabled={(d) => (value.from ? d < value.from : false)}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          aria-label="Limpiar rango"
        >
          <XIcon className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export type { DateRangePickerProps };
export { DateRangePicker };
