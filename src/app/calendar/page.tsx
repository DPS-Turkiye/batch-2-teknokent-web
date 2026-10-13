import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CalendarView } from "@/components/calendar-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("calendar"), description: t("calendarDescription") };
}

export default function CalendarPage() {
  return <CalendarView />;
}
