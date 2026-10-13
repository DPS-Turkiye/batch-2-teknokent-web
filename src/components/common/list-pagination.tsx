"use client";

import { useTranslations } from "next-intl";

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
  label,
}: ListPaginationProps) {
  const t = useTranslations("pagination");
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-5 flex flex-wrap items-center justify-center gap-2"
      aria-label={label ?? t("page")}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[var(--ms-accent-border,#f2b78f)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("previous")}
      </button>
      <span className="px-2 text-[13px] text-[#676e78]">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[var(--ms-accent-border,#f2b78f)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("next")}
      </button>
    </nav>
  );
}
