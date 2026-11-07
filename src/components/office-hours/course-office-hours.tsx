"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { OfficeHoursMeetings } from "@/components/office-hours/office-hours-meetings";
import { OfficeHoursRequestCard } from "@/components/office-hours/office-hours-request-card";
import { OfficeHoursRequestDialog } from "@/components/office-hours/office-hours-request-dialog";
import {
  useCourseInstructors,
  useOfficeHoursRequests,
} from "@/hooks/use-office-hours-booking";
import {
  OfficeHoursRole,
  type OfficeHoursPerson,
} from "@/interfaces/office-hours";

/**
 * Booking in one course: a student sees the course's academics, asks one of them for office hours, and follows
 * their requests; an academic answers the requests sent to them. Both see the upcoming meetings.
 */
export function CourseOfficeHours({
  courseId,
  viewer,
}: {
  courseId: string;
  viewer: OfficeHoursRole;
}) {
  const t = useTranslations("officeHours.booking");
  const student = viewer === OfficeHoursRole.Student;
  const instructors = useCourseInstructors(courseId);
  const requests = useOfficeHoursRequests(courseId);
  const [requesting, setRequesting] = useState<OfficeHoursPerson | null>(null);

  return (
    <>
      {student ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-[#22262b]">
            {t("academics")}
          </h2>
          {instructors.isLoading ? (
            <p className="mt-2 text-sm text-[#858c96]">{t("loading")}</p>
          ) : (instructors.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-[#858c96]">{t("noAcademics")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {(instructors.data ?? []).map((instructor) => (
                <li
                  key={instructor.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ea] bg-white px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#22262b]">
                    {instructor.fullName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRequesting(instructor)}
                    className="rounded-full bg-[#e86f22] px-4 py-2 text-[12.5px] font-medium text-white hover:bg-[#ce5e19]"
                  >
                    {t("request")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <OfficeHoursMeetings courseId={courseId} viewer={viewer} />

      <section className="mt-8">
        <h2 className="text-base font-semibold text-[#22262b]">
          {student ? t("myRequests") : t("incoming")}
        </h2>
        {requests.error ? (
          <p role="alert" className="mt-2 text-sm text-[#a65a15]">
            {t("loadFailed")}
          </p>
        ) : requests.isLoading ? (
          <p className="mt-2 text-sm text-[#858c96]">{t("loading")}</p>
        ) : (requests.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-[#858c96]">{t("noRequests")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {(requests.data ?? []).map((request) => (
              <OfficeHoursRequestCard
                key={request.id}
                request={request}
                viewer={viewer}
              />
            ))}
          </ul>
        )}
      </section>

      {requesting ? (
        <OfficeHoursRequestDialog
          courseId={courseId}
          instructor={requesting}
          onClose={() => setRequesting(null)}
        />
      ) : null}
    </>
  );
}
