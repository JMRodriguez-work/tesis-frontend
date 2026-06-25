type WarehouseBranch = { id: string; name: string };

type WarehouseBranchesListProps = {
  branches: WarehouseBranch[];
};

function WarehouseBranchesList({ branches }: WarehouseBranchesListProps) {
  if (branches.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (branches.length <= 2) {
    return (
      <div className="flex flex-wrap gap-1">
        {branches.map((b) => (
          <span
            key={b.id}
            className="inline-flex h-5 items-center rounded-none border border-border bg-secondary px-2 text-xs font-medium text-secondary-foreground"
          >
            {b.name}
          </span>
        ))}
      </div>
    );
  }

  const visible = branches.slice(0, 2);
  const remaining = branches.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((b) => (
        <span
          key={b.id}
          className="inline-flex h-5 items-center rounded-none border border-border bg-secondary px-2 text-xs font-medium text-secondary-foreground"
        >
          {b.name}
        </span>
      ))}
      <span className="text-xs text-muted-foreground">+{remaining}</span>
    </div>
  );
}

export type { WarehouseBranch };
export { WarehouseBranchesList };
