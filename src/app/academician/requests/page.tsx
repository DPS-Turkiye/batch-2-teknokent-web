import { redirect } from "next/navigation";

import { appointmentsHref } from "@/lib/academician-calendar";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";
import { AppointmentsFilter } from "@/types/academician-calendar";

/** Talepler moved into Randevularım; an old link lands on the calendar with requests selected. */
export default function AcademicianRequestsPage() {
  redirect(
    appointmentsHref(ACADEMICIAN_ROUTES.appointments, {
      filter: AppointmentsFilter.Requests,
    }),
  );
}
