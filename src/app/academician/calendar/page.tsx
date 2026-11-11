import { redirect } from "next/navigation";

import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";

/** Takvim became "Müsaitliği düzenle" under Randevularım; an old link lands there. */
export default function AcademicianCalendarPage() {
  redirect(ACADEMICIAN_ROUTES.availability);
}
