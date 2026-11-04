"use client";
import { useTranslations } from "next-intl";
/** The program captured on the relationship, rather than the startup's current membership. */
export function ProgramContext({ name }: { name?: string | null }) {
  const t = useTranslations("programContext");
  return (
    <span className="inline-flex rounded-full bg-[#f4f5f7] px-2.5 py-1 text-xs text-[#676e78]">
      <span className="sr-only">{t("label")}: </span>
      {name || t("unknown")}
    </span>
  );
}
