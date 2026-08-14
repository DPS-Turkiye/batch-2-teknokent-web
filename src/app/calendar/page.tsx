import type { Metadata } from "next";

import { CalendarView } from "@/components/calendar-view";

export const metadata: Metadata = {
  title: "Takvimim | Teknokent",
  description: "Mentorluk görüşmeleri ve kişisel toplantı takvimi.",
};

export default function CalendarPage() {
  return <CalendarView />;
}
