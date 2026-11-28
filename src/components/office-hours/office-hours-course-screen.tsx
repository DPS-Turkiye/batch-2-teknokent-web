"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { CourseOfficeHours } from "@/components/office-hours/course-office-hours";
import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { useOfficeHoursCoursePage } from "@/hooks/use-office-hours-pages";
import { OfficeHoursRole } from "@/interfaces/office-hours";

const PROFILE_HREF = "/office-hours/profile";

function InstructorCourseSection() {
  const t = useTranslations("officeHours");
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e4e7ea] bg-white p-6">
      <p className="max-w-[520px] text-sm leading-6 text-[#4a5059]">
        {t("instructor.availabilityHint")}
      </p>
      <Link
        href={PROFILE_HREF}
        className="rounded-full border border-[#d4d8dd] px-[18px] py-2.5 text-[12.5px] font-medium text-[#22262b] hover:bg-[#f8f9fa]"
      >
        {t("instructor.manageAvailability")}
      </Link>
    </section>
  );
}

// A Record, so a new Moodle role fails to compile until it has a view.
const COURSE_VIEWS: Record<
  OfficeHoursRole,
  { Section: (() => React.JSX.Element) | null; profile: boolean }
> = {
  [OfficeHoursRole.Instructor]: {
    Section: InstructorCourseSection,
    profile: true,
  },
  [OfficeHoursRole.Student]: { Section: null, profile: false },
};

export function OfficeHoursCourseScreen({ courseId }: { courseId: string }) {
  const t = useTranslations("officeHours");
  const course = useOfficeHoursCoursePage(courseId);
  if (!course) return null;
  const { Section, profile } = COURSE_VIEWS[course.role];

  return (
    <OfficeHoursFrame
      productName={t("title")}
      userName={course.userFullName}
      profile={
        profile ? { href: PROFILE_HREF, label: t("profile.title") } : null
      }
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#e86f22]">
        {course.shortName ?? t("course")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold leading-8 text-[#22262b]">
        {course.title}
      </h1>
      <p className="mt-2 inline-flex rounded-full bg-[#f2f8fc] px-3 py-1 text-[12px] font-medium text-[#1592ea]">
        {t(`roles.${course.role}`)}
      </p>
      {Section ? <Section /> : null}
      <CourseOfficeHours courseId={course.courseId} viewer={course.role} />
    </OfficeHoursFrame>
  );
}
