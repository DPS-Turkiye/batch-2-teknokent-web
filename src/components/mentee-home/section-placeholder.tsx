import { useTranslations } from "next-intl";

export function SectionPlaceholder({
  loading,
  emptyText,
  framed = true,
}: {
  loading: boolean;
  emptyText: string;
  framed?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <p
      aria-live="polite"
      className={`p-7 text-center text-sm text-[#838c99] ${framed ? "rounded-[20px] border border-[#e4e7ea] bg-white" : ""}`}
    >
      {loading ? t("loading") : emptyText}
    </p>
  );
}
