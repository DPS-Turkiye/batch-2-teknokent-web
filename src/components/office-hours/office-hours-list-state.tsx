"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** Each booking list goes error → loading → empty → items in the same order, so the order lives in one place. */
export function OfficeHoursListState<T>({
  query,
  emptyText,
  children,
}: {
  query: Pick<UseQueryResult<T[]>, "data" | "error" | "isLoading">;
  emptyText: string;
  children: (items: T[]) => ReactNode;
}) {
  const t = useTranslations("officeHours.booking");
  if (query.error) {
    return (
      <p role="alert" className="mt-2 text-sm text-[#a65a15]">
        {t("loadFailed")}
      </p>
    );
  }
  if (query.isLoading) {
    return <p className="mt-2 text-sm text-[#858c96]">{t("loading")}</p>;
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-[#858c96]">{emptyText}</p>;
  }
  return children(items);
}
