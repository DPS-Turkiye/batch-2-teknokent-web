// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import { MeetingBotNoticeTone, type MeetingBotNotice } from "@/types/assistant";

const TONE_COLOR: Record<MeetingBotNoticeTone, string> = {
  [MeetingBotNoticeTone.Info]: "var(--ma-t2)",
  [MeetingBotNoticeTone.Success]: "var(--ma-green)",
  [MeetingBotNoticeTone.Danger]: "var(--ma-danger)",
};

export function MeetingBotNoticeLine({
  notice,
  tone,
}: {
  notice: MeetingBotNotice | null;
  tone: MeetingBotNoticeTone;
}) {
  const t = useTranslations("assistant");
  if (!notice) return null;
  return (
    <p
      role="status"
      aria-label={t("botNoticeLabel")}
      className="mt-2 text-[11.5px] font-medium leading-relaxed"
      style={{ color: TONE_COLOR[tone] }}
    >
      {t(`botNotice.${notice}`)}
    </p>
  );
}
