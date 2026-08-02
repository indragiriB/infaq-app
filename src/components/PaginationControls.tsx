interface PaginationControlsProps {
  page: number; // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const awal = (page - 1) * pageSize + 1;
  const akhir = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-maroon-500 dark:text-cream-100/50">
      <span>
        {awal}–{akhir} dari {totalItems}
      </span>
      <div className="flex items-center gap-1 rounded-full bg-maroon-100/70 p-1 dark:bg-maroon-900/60">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-full px-2.5 py-1 text-maroon-600 hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-cream-100/70 dark:hover:bg-maroon-800"
        >
          ‹
        </button>
        <span className="min-w-[4.5rem] text-center font-medium text-maroon-800 dark:text-cream-50">
          Hal {page}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-full px-2.5 py-1 text-maroon-600 hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-cream-100/70 dark:hover:bg-maroon-800"
        >
          ›
        </button>
      </div>
    </div>
  );
}
