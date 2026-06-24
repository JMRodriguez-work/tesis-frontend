import { Combobox } from '@base-ui/react/combobox';
import { CaretDownIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type ComboboxItem = {
  label: string;
  value: string | null;
};

type ComboboxFieldProps = {
  items: ComboboxItem[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
};

function ComboboxField({
  items,
  value,
  onValueChange,
  label,
  placeholder = 'Seleccioná una opción',
  emptyMessage = 'Sin resultados',
  disabled,
  className,
  triggerClassName,
  id,
}: ComboboxFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const selected = value === null ? null : (items.find((item) => item.value === value) ?? null);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-xs font-medium">
        {label}
      </label>
      <Combobox.Root
        items={items}
        value={selected}
        onValueChange={(next) => onValueChange(next?.value ?? null)}
        disabled={disabled}
      >
        <Combobox.Trigger
          id={fieldId}
          data-slot="combobox-trigger"
          className={cn(
            "flex w-full items-center justify-between gap-1.5 rounded-none border border-input bg-transparent py-2 pr-2 pl-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            triggerClassName,
          )}
        >
          <Combobox.Value placeholder={placeholder} />
          <Combobox.Icon
            render={<CaretDownIcon className="pointer-events-none size-4 text-muted-foreground" />}
          />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="isolate z-50">
            <Combobox.Popup
              data-slot="combobox-popup"
              className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-none bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            >
              <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
                <Combobox.Input
                  placeholder="Buscar…"
                  className="h-7 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                <Combobox.Clear
                  aria-label="Limpiar búsqueda"
                  className="flex size-5 shrink-0 items-center justify-center rounded-none text-muted-foreground hover:text-foreground"
                >
                  <XIcon />
                </Combobox.Clear>
              </div>
              <Combobox.Empty className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </Combobox.Empty>
              <Combobox.List className="max-h-72 overflow-y-auto p-0.5">
                {(item: ComboboxItem) => (
                  <Combobox.Item
                    key={item.value ?? '__null__'}
                    value={item}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-none py-1.5 pr-8 pl-2 text-xs outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                      {item.label}
                    </span>
                    <Combobox.ItemIndicator
                      render={
                        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                      }
                    >
                      <CheckIcon className="pointer-events-none" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

export { ComboboxField };
