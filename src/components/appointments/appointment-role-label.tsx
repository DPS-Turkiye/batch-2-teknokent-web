// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import type {
  AppointmentKind,
  AppointmentSide,
} from "@/interfaces/appointment";
import { appointmentRoleKey } from "@/lib/appointments";

/** "Mentor olarak" / "Mentee olarak" on peer-mentoring rows, "Office Hours" on Office Hours rows. */
export function AppointmentRoleLabel({
  kind,
  side,
}: {
  kind: AppointmentKind;
  side: AppointmentSide;
}) {
  const t = useTranslations("appointments.role");
  return (
    <span className="inline-flex items-center rounded-full border border-[#e4e7ea] bg-white px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium text-[#4a5059]">
      {t(appointmentRoleKey(kind, side))}
    </span>
  );
}
