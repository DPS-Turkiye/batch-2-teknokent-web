import { useTranslations } from "next-intl";

import { BotStatus } from "@/types/assistant";

export function BotStatusRenderer({
  status,
  error,
}: {
  status: BotStatus | null;
  error: string | null;
}) {
  const t = useTranslations("assistant");
  if (status === BotStatus.Ok) {
    return (
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ma-green)]">
        {t("botSent")}
      </p>
    );
  }

  if (status === BotStatus.Err) {
    return (
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ma-danger)]">
        {error ?? t("sendFailed")}
      </p>
    );
  }

  return null;
}
