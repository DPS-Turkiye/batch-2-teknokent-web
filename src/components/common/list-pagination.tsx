"use client";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function ListPagination({
  page,
  totalPages,
  onPageChange,
  label = "Sayfa",
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-5 flex flex-wrap items-center justify-center gap-2"
      aria-label={label}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[#f2b78f] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Önceki
      </button>
      <span className="px-2 text-[13px] text-[#676e78]">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[#f2b78f] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sonraki
      </button>
    </nav>
  );
}
