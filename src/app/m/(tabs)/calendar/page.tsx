import { Suspense } from "react";

import { MobileCalendarView } from "@/components/mobile/mobile-calendar-view";
import { MobileListSkeleton } from "@/components/mobile/mobile-states";

export default function MobileCalendarPage() {
  return (
    <Suspense fallback={<MobileListSkeleton />}>
      <MobileCalendarView />
    </Suspense>
  );
}
