import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CourseOfficeHours } from "@/components/office-hours/course-office-hours";
import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { LtiLaunchError, OfficeHoursRole } from "@/interfaces/office-hours";
import { fetchOfficeHoursCourse } from "@/lib/api/lti";
import { ltiErrorPath } from "@/lib/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

const PROFILE_LINK = {
  href: "/office-hours/profile",
  labelKey: "profile.title",
} as const;

type OfficeHoursTexts = Awaited<
  ReturnType<typeof getTranslations<"officeHours">>
>;

function InstructorCourseSection({ t }: { t: OfficeHoursTexts }) {
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e4e7ea] bg-white p-6">
      <p className="max-w-[520px] text-sm leading-6 text-[#4a5059]">
        {t("instructor.availabilityHint")}
      </p>
      <Link
        href={PROFILE_LINK.href}
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
  {
    Section: ((props: { t: OfficeHoursTexts }) => React.JSX.Element) | null;
    profile: typeof PROFILE_LINK | null;
  }
> = {
  [OfficeHoursRole.Instructor]: {
    Section: InstructorCourseSection,
    profile: PROFILE_LINK,
  },
  [OfficeHoursRole.Student]: { Section: null, profile: null },
};

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("title") };
}

export default async function OfficeHoursCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await getOfficeHoursUser();
  if (!user) redirect(ltiErrorPath(LtiLaunchError.Expired));
  const { courseId } = await params;
  const response = await fetchOfficeHoursCourse(user.userId, courseId);
  if (response.status !== 200) redirect(ltiErrorPath(LtiLaunchError.Expired));
  const course = response.data;
  const t = await getTranslations("officeHours");
  const { Section, profile } = COURSE_VIEWS[course.role];

  return (
    <OfficeHoursFrame
      productName={t("title")}
      userName={course.userFullName}
      profile={profile && { href: profile.href, label: t(profile.labelKey) }}
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
      {Section && <Section t={t} />}
      <CourseOfficeHours courseId={course.courseId} viewer={course.role} />
    </OfficeHoursFrame>
  );
}
