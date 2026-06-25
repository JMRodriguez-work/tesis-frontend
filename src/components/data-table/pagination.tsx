import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { DataTableMeta } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';

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
    <nav className="flex items-center justify-between" aria-label="Paginación">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Mostrando {start}–{end} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={isFirst}
          aria-label="Página anterior"
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
          aria-label="Página siguiente"
        >
          Siguiente
          <CaretRightIcon className="size-3" />
        </Button>
      </div>
    </nav>
  );
}

export { Pagination };
