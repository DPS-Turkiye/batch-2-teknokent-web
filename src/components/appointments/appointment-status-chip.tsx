// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/admin/admin-ui";
import type { AppointmentStatus } from "@/interfaces/appointment";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointments";

export function AppointmentStatusChip({
  status,
}: {
  status: AppointmentStatus;
}) {
  const t = useTranslations("appointments.status");
  return (
    <StatusChip tone={APPOINTMENT_STATUS_TONE[status]}>{t(status)}</StatusChip>
  );
}
