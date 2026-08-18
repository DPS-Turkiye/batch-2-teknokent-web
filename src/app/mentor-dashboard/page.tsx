import type { Metadata } from "next";

import { MentorDashboardView } from "@/components/mentor-dashboard-view";

export const metadata: Metadata = {
  title: "Mentor Paneli | Teknokent",
  description: "Gelen mentorluk talepleri inceleme ve karar ekranı.",
};

export default function MentorDashboardPage() {
  return <MentorDashboardView />;
}
