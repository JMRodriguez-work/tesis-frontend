import { DownloadSimpleIcon, FileCodeIcon, FileCsvIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useExportSales } from '@/api/queries/use-sales';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentBranchId } from '@/hooks/use-branch';
import { mapApiError } from '@/lib/api-error';

function SaleExportMenu() {
  const exportSales = useExportSales();
  const [open, setOpen] = useState(false);
  const currentBranchId = useCurrentBranchId();

  const handleExport = (format: 'csv' | 'json') => {
    exportSales.mutate(
      { format, ...(currentBranchId ? { branchId: currentBranchId } : {}) },
      {
        onSuccess: () => {
          toast.success(`Exportando ${format.toUpperCase()}…`);
          setOpen(false);
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={exportSales.isPending}>
            <DownloadSimpleIcon className="size-4" />
            Exportar
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileCsvIcon className="size-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileCodeIcon className="size-4" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SaleExportMenu };
