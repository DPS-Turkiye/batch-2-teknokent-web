"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";
import { useId } from "react";

import { useMeetingBotButton } from "@/hooks/use-meeting-bot-button";
import type { MeetingItem } from "@/interfaces/meeting";
import { BOT_ADMISSION_WARNING_MINUTES } from "@/lib/meeting-bot";

/** Next to "join": sends the recording bot to this meeting. */
export function MeetingBotButton({
  meeting,
  className,
  noticeClassName,
}: {
  meeting: MeetingItem;
  className: string;
  noticeClassName: string;
}) {
  const t = useTranslations("meetingBotButton");
  const tNotice = useTranslations("assistant.botNotice");
  const bot = useMeetingBotButton(meeting);
  const hintId = useId();
  if (!bot.canSend) return null;
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={bot.send}
        disabled={bot.isSending || bot.isInMeeting}
        title={t("hint")}
        aria-describedby={hintId}
        className={`${className} disabled:cursor-default disabled:opacity-60`}
      >
        {bot.isSending ? t("sending") : t("add")}
      </button>
      <span id={hintId} hidden>
        {t("hint")}
      </span>
      <span
        role="status"
        className={bot.botNotice ? noticeClassName : "sr-only"}
      >
        {bot.botNotice
          ? tNotice(bot.botNotice, { minutes: BOT_ADMISSION_WARNING_MINUTES })
          : null}
      </span>
    </span>
  );
}
