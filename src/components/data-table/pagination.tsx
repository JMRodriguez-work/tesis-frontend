import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

type DataTableMeta = { page: number; limit: number; total: number; totalPages: number };

type PaginationProps = {
  meta: DataTableMeta;
  onPageChange: (page: number) => void;
};

function Pagination({ meta, onPageChange }: PaginationProps) {
  const isFirst = meta.page <= 1;
  const isLast = meta.page >= meta.totalPages;
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Mostrando {start}–{end} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={isFirst}
        >
          <CaretLeftIcon className="size-3" />
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          Página {meta.page} de {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={isLast}
        >
          Siguiente
          <CaretRightIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}

export type { DataTableMeta };
export { Pagination };
