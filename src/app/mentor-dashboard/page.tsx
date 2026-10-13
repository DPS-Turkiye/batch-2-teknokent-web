import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MentorDashboardView } from "@/components/mentor-dashboard-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("mentorDashboard"),
    description: t("mentorDashboardDescription"),
  };
}

export default function MentorDashboardPage() {
  return <MentorDashboardView />;
}
