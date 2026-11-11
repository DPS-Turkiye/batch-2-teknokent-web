// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import { BOT_ADMISSION_WARNING_MINUTES } from "@/lib/meeting-bot";
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
  // The region stays mounted so screen readers announce each change of the bot's state.
  return (
    <p
      role="status"
      aria-label={t("botNoticeLabel")}
      className={
        notice ? "mt-2 text-[11.5px] font-medium leading-relaxed" : "sr-only"
      }
      style={{ color: TONE_COLOR[tone] }}
    >
      {notice
        ? t(`botNotice.${notice}`, { minutes: BOT_ADMISSION_WARNING_MINUTES })
        : null}
    </p>
  );
}
