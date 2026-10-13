"use client";

import { useTranslations } from "next-intl";
import type { MeetingItem } from "@/interfaces/meeting";
import { googleCalendarAddUrl, icalFileContents } from "@/lib/calendar-sync";

function downloadICalFile(meeting: MeetingItem) {
  const blob = new Blob([icalFileContents(meeting)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `toplanti-${meeting.id.substring(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * "Add to Google Calendar" / "Download iCal" for one meeting. Stateless and
 * client-side only, so both mentor and mentee detail views can use it without
 * the import/persistence machinery that only makes sense for the mentee's own
 * calendar (see use-calendar-import).
 */
export function SyncMeetingActions({ meeting }: { meeting: MeetingItem }) {
  const t = useTranslations("calendar.sync");
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a
        href={googleCalendarAddUrl(meeting)}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2f7ff0] py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#1f6fe0]"
      >
        {t("addGoogle")}
      </a>
      <button
        type="button"
        onClick={() => downloadICalFile(meeting)}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e7ea] bg-white py-2.5 text-center text-xs font-bold text-[#22262b] transition hover:bg-[#f8f9fa]"
      >
        {t("downloadIcs")}
      </button>
    </div>
  );
}
