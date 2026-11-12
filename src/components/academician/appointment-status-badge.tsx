import { Check, CircleX, Clock, Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { AppointmentStatus } from "@/interfaces/appointment";

const ICON_CLASS = "size-3.5 stroke-[1.75]";

const STATUS_LOOK: Record<
  AppointmentStatus,
  { tone: StatusTone; icon: ReactNode }
> = {
  [AppointmentStatus.Pending]: {
    tone: StatusTone.Warning,
    icon: <Hourglass aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.Confirmed]: {
    tone: StatusTone.Success,
    icon: <Check aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.AlternativeProposed]: {
    tone: StatusTone.Info,
    icon: <Clock aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.Rejected]: {
    tone: StatusTone.Error,
    icon: <CircleX aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.Cancelled]: {
    tone: StatusTone.Neutral,
    icon: <CircleX aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.Expired]: {
    tone: StatusTone.Neutral,
    icon: <Clock aria-hidden className={ICON_CLASS} />,
  },
  [AppointmentStatus.Withdrawn]: {
    tone: StatusTone.Neutral,
    icon: <CircleX aria-hidden className={ICON_CLASS} />,
  },
};

/**
 * An Office Hours status in the design system's badge. The shared `appointments/` chip is the student
 * workspace's and still on the old style, so the academician screens keep their own until both move together.
 */
export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const t = useTranslations("iaAcademician.common.status");
  const look = STATUS_LOOK[status];
  return (
    <StatusBadge tone={look.tone} icon={look.icon}>
      {t(status)}
    </StatusBadge>
  );
}
