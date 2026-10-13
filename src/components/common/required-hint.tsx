import { useTranslations } from "next-intl";
export function RequiredHint({ show }: { show: boolean }) {
  const t = useTranslations("sharedUi");
  if (!show) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-[#b42318]">
      {t("required")}
    </p>
  );
}
