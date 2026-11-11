"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { OfficeHoursListState } from "@/components/office-hours/office-hours-list-state";
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

// A Record, so a new role fails to compile until its request list has a title.
const REQUESTS_TITLE: Record<OfficeHoursRole, "myRequests" | "incoming"> = {
  [OfficeHoursRole.Student]: "myRequests",
  [OfficeHoursRole.Instructor]: "incoming",
};

function CourseAcademics({
  courseId,
  onRequest,
}: {
  courseId: string;
  onRequest: (instructor: OfficeHoursPerson) => void;
}) {
  const t = useTranslations("officeHours.booking");
  const instructors = useCourseInstructors(courseId);
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-[#22262b]">
        {t("academics")}
      </h2>
      <OfficeHoursListState query={instructors} emptyText={t("noAcademics")}>
        {(items) => (
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((instructor) => (
              <li
                key={instructor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ea] bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-[#22262b]">
                  {instructor.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => onRequest(instructor)}
                  className="rounded-full bg-[#e86f22] px-4 py-2 text-[12.5px] font-medium text-white hover:bg-[#ce5e19]"
                >
                  {t("request")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </OfficeHoursListState>
    </section>
  );
}

function CourseRequests({
  courseId,
  viewer,
}: {
  courseId: string;
  viewer: OfficeHoursRole;
}) {
  const t = useTranslations("officeHours.booking");
  const requests = useOfficeHoursRequests(courseId);
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-[#22262b]">
        {t(REQUESTS_TITLE[viewer])}
      </h2>
      <OfficeHoursListState query={requests} emptyText={t("noRequests")}>
        {(items) => (
          <ul className="mt-3 flex flex-col gap-3">
            {items.map((request) => (
              <OfficeHoursRequestCard
                key={request.id}
                request={request}
                viewer={viewer}
              />
            ))}
          </ul>
        )}
      </OfficeHoursListState>
    </section>
  );
}

export function CourseOfficeHours({
  courseId,
  viewer,
}: {
  courseId: string;
  viewer: OfficeHoursRole;
}) {
  const [requesting, setRequesting] = useState<OfficeHoursPerson | null>(null);

  return (
    <>
      {viewer === OfficeHoursRole.Student && (
        <CourseAcademics courseId={courseId} onRequest={setRequesting} />
      )}
      <OfficeHoursMeetings courseId={courseId} viewer={viewer} />
      <CourseRequests courseId={courseId} viewer={viewer} />
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
