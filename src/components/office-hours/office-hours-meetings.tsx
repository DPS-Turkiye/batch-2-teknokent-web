"use client";

import { useLocale, useTranslations } from "next-intl";

import { OfficeHoursListState } from "@/components/office-hours/office-hours-list-state";
import { useOfficeHoursMeetings } from "@/hooks/use-office-hours-booking";
import type { OfficeHoursRole } from "@/interfaces/office-hours";
import { counterpartOf, meetingTimeLabel } from "@/lib/office-hours-booking";

export function OfficeHoursMeetings({
  courseId,
  viewer,
}: {
  courseId: string;
  viewer: OfficeHoursRole;
}) {
  const t = useTranslations("officeHours.booking");
  const locale = useLocale();
  const meetings = useOfficeHoursMeetings(courseId);

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-[#22262b]">
        {t("meetings")}
      </h2>
      <OfficeHoursListState query={meetings} emptyText={t("noMeetings")}>
        {(items) => (
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((meeting) => (
              <li
                key={meeting.id}
                className="rounded-xl border border-[#e4e7ea] bg-white px-4 py-3 text-sm"
              >
                <p className="font-medium text-[#22262b]">
                  {meetingTimeLabel(meeting.scheduledAt, locale)} ·{" "}
                  {meeting.durationMinutes}′
                </p>
                <p className="mt-0.5 text-[12.5px] text-[#676e78]">
                  {t("with", {
                    name: counterpartOf(viewer, meeting).fullName,
                  })}{" "}
                  · {meeting.topic}
                </p>
              </li>
            ))}
          </ul>
        )}
      </OfficeHoursListState>
    </section>
  );
}
