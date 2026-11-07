import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AcademicProfileView } from "@/components/office-hours/academic-profile-view";
import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { LtiLaunchError } from "@/interfaces/office-hours";
import { fetchOfficeHoursAvailability } from "@/lib/api/lti";
import { ltiErrorPath } from "@/lib/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("profile.title") };
}

/** "Profilim" for academics: where they set their office hours, as a mentor does on their profile. */
export default async function OfficeHoursProfilePage() {
  const user = await getOfficeHoursUser();
  if (!user) redirect(ltiErrorPath(LtiLaunchError.Expired));
  // Students have no office hours of their own; the backend says who is an academic.
  const access = await fetchOfficeHoursAvailability(user.userId);
  if (access.status === 403) redirect(ltiErrorPath(LtiLaunchError.NoRole));
  const t = await getTranslations("officeHours");

  return (
    <OfficeHoursFrame
      productName={t("title")}
      userName={user.fullName}
      profile={{ href: "/office-hours/profile", label: t("profile.title") }}
    >
      <AcademicProfileView fullName={user.fullName} />
    </OfficeHoursFrame>
  );
}
