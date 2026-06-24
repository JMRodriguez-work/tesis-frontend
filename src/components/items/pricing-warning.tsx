import { WarningIcon, XIcon } from '@phosphor-icons/react';
import type { PricingWarning as PricingWarningData } from '@/api/queries/use-items';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type PricingWarningProps = {
  warning: PricingWarningData;
  onDismiss?: () => void;
};

function PricingWarning({ warning, onDismiss }: PricingWarningProps) {
  return (
    <Alert variant="warning">
      <WarningIcon weight="fill" />
      <div className="flex-1">
        <AlertTitle>Precio de venta menor al de compra</AlertTitle>
        <AlertDescription>{warning.message}</AlertDescription>
      </div>
      {onDismiss ? (
        <Button variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Cerrar advertencia">
          <XIcon className="size-3" />
        </Button>
      ) : null}
    </Alert>
  );
}

export { PricingWarning };
