import { MagnifyingGlassPlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { DetectInactiveCustomersDialog } from '@/components/customer-analytics/detect-inactive-customers-dialog';
import { Button } from '@/components/ui/button';

type DetectInactiveButtonProps = {
  branchId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'icon' | 'icon-sm' | 'icon-xs';
  label?: string;
  className?: string;
};

function DetectInactiveButton({
  branchId,
  variant = 'outline',
  size = 'default',
  label = 'Detectar inactivos',
  className,
}: DetectInactiveButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <MagnifyingGlassPlusIcon className="size-4" />
        {label}
      </Button>
      <DetectInactiveCustomersDialog open={open} onOpenChange={setOpen} branchId={branchId} />
    </>
  );
}

export type { DetectInactiveButtonProps };
export { DetectInactiveButton };
