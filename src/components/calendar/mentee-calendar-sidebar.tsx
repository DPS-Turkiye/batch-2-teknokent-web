import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import type { ActionItem } from "@/interfaces/action-item";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  CalendarEntryKind,
  entryWhenLabel,
  prepHeading,
  PrepStatus,
  prepStatus,
  type CalendarEntry,
} from "@/lib/mentee-calendar";
import { meetingNotebookHref } from "@/lib/startup-meetings";

const WHEN_COLORS: Record<CalendarEntryKind, string> = {
  [CalendarEntryKind.Mentorship]: "text-[#c95c18]",
  [CalendarEntryKind.Program]: "text-[#676e78]",
  [CalendarEntryKind.Deliverable]: "text-[#a65a15]",
};

const PREP_CHIPS: Record<PrepStatus, string> = {
  [PrepStatus.Overdue]: "bg-[#fef6ec] text-[#a65a15]",
  [PrepStatus.InProgress]: "bg-[#f3f4f6] text-[#676e78]",
};

const cardHeading = "text-[15px] font-semibold leading-[21px] text-[#22262b]";

const mutedText = "text-[12.5px] leading-[18px] text-[#676e78]";

export function PrepCard({
  meeting,
  items,
  now,
  isLoading,
}: {
  meeting: MeetingItem;
  items: ActionItem[];
  now: Date;
  isLoading: boolean;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="calendar-prep"
      className="space-y-3 rounded-[24px] bg-[#fff4ec]/[0.27] p-[18px]"
    >
      <h2 id="calendar-prep" className={cardHeading}>
        {t("prep.title")}
      </h2>
      <p className="text-[12.5px] leading-[18px] text-[#4a5059]">
        {prepHeading(meeting, { t, locale })}
      </p>
      {isLoading ? (
        <p className={mutedText}>{t("prep.loading")}</p>
      ) : items.length === 0 ? (
        <p className={mutedText}>{t("prep.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const status = prepStatus(item, now);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5"
              >
                <span className="min-w-0 text-[12.5px] font-medium leading-[18px] text-[#22262b]">
                  {item.title}
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-[5px] text-xs font-medium leading-[17px] ${PREP_CHIPS[status]}`}
                >
                  {t(`prep.status.${status}`)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href={meetingNotebookHref(meeting.id)}
        className="flex w-full items-center justify-center rounded-full bg-[#e86f22] px-4 py-2.5 text-[12.5px] font-medium leading-[18px] text-white transition hover:bg-[#ce5e19]"
      >
        {items.length > 0 ? t("prep.complete") : t("prep.openNotes")}
      </Link>
    </section>
  );
}

export function UpcomingCard({
  entries,
  isLoading,
  hasError,
}: {
  entries: CalendarEntry[];
  isLoading: boolean;
  hasError: boolean;
}) {
  const t = useTranslations("calendar.upcoming");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="calendar-upcoming"
      className="space-y-3 rounded-[24px] border border-[#e4e7ea] bg-white p-[18px]"
    >
      <h2 id="calendar-upcoming" className={cardHeading}>
        {t("title")}
      </h2>
      {hasError ? (
        <p role="alert" className="text-[12.5px] leading-[18px] text-[#a65a15]">
          {t("deliverablesFailed")}
        </p>
      ) : null}
      {isLoading ? (
        <p className={mutedText}>{t("loading")}</p>
      ) : entries.length === 0 ? (
        <p className={mutedText}>{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium leading-[18px] text-[#22262b]">
                  {entry.title}
                </p>
                <p className="truncate text-[11.5px] leading-4 text-[#676e78]">
                  {entry.detail}
                </p>
              </div>
              <p
                className={`shrink-0 text-[11.5px] font-medium leading-4 ${WHEN_COLORS[entry.kind]}`}
              >
                {entryWhenLabel(entry, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
