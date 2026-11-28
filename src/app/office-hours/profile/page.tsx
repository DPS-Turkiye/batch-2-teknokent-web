import { getTranslations } from "next-intl/server";

import { OfficeHoursProfileScreen } from "@/components/office-hours/office-hours-profile-screen";

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("profile.title") };
}

export default function OfficeHoursProfilePage() {
  return <OfficeHoursProfileScreen />;
}
