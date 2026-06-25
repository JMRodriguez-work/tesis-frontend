import { useMemo } from 'react';
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';

const INTERVAL_ITEMS: ComboboxItem[] = [
  { label: 'Por día', value: 'day' },
  { label: 'Por semana', value: 'week' },
  { label: 'Por mes', value: 'month' },
];

type IntervalSelectorProps = {
  value: 'day' | 'week' | 'month';
  onChange: (value: 'day' | 'week' | 'month') => void;
  className?: string;
  id?: string;
};

function IntervalSelector({ value, onChange, className, id }: IntervalSelectorProps) {
  const items = useMemo(() => INTERVAL_ITEMS, []);
  return (
    <ComboboxField
      id={id}
      label="Intervalo"
      items={items}
      value={value}
      onValueChange={(v) => {
        if (v === 'day' || v === 'week' || v === 'month') onChange(v);
      }}
      placeholder="Por día"
      className={className}
    />
  );
}

export type { IntervalSelectorProps };
export { IntervalSelector };
