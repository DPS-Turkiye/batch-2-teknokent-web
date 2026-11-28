import { getTranslations } from "next-intl/server";

import { OfficeHoursCourseScreen } from "@/components/office-hours/office-hours-course-screen";

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("title") };
}

export default async function OfficeHoursCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <OfficeHoursCourseScreen courseId={courseId} />;
}
