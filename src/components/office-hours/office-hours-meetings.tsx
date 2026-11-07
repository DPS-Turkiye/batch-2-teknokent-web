"use client";

import { useLocale, useTranslations } from "next-intl";

import { useOfficeHoursMeetings } from "@/hooks/use-office-hours-booking";
import { OfficeHoursRole } from "@/interfaces/office-hours";
import { meetingTimeLabel } from "@/lib/office-hours-booking";

/** The course's upcoming office hours for the signed-in person, soonest first. */
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
      {meetings.error ? (
        <p role="alert" className="mt-2 text-sm text-[#a65a15]">
          {t("loadFailed")}
        </p>
      ) : meetings.isLoading ? (
        <p className="mt-2 text-sm text-[#858c96]">{t("loading")}</p>
      ) : (meetings.data ?? []).length === 0 ? (
        <p className="mt-2 text-sm text-[#858c96]">{t("noMeetings")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {(meetings.data ?? []).map((meeting) => (
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
                  name:
                    viewer === OfficeHoursRole.Instructor
                      ? meeting.student.fullName
                      : meeting.instructor.fullName,
                })}{" "}
                · {meeting.topic}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
