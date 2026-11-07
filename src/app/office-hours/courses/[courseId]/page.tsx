import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { LtiLaunchError, OfficeHoursRole } from "@/interfaces/office-hours";
import { fetchOfficeHoursCourse } from "@/lib/api/lti";
import { ltiErrorPath } from "@/lib/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("title") };
}

/** Where a launch from a Moodle course lands: the course, as an instructor or a student sees it. */
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
  const instructor = course.role === OfficeHoursRole.Instructor;

  return (
    <OfficeHoursFrame productName={t("title")} userName={course.userFullName}>
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#e86f22]">
        {course.shortName ?? t("course")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold leading-8 text-[#22262b]">
        {course.title}
      </h1>
      <p className="mt-2 inline-flex rounded-full bg-[#f2f8fc] px-3 py-1 text-[12px] font-medium text-[#1592ea]">
        {t(instructor ? "roles.INSTRUCTOR" : "roles.STUDENT")}
      </p>
      <section className="mt-8 rounded-2xl border border-[#e4e7ea] bg-white p-6">
        <h2 className="text-base font-semibold text-[#22262b]">
          {t(instructor ? "instructor.title" : "student.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#4a5059]">
          {t(instructor ? "instructor.comingSoon" : "student.comingSoon")}
        </p>
      </section>
    </OfficeHoursFrame>
  );
}
