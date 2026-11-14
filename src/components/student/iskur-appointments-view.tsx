"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { StudentAppointmentsView } from "@/components/student/appointments-view";
import { useIskurAppointmentsRole } from "@/hooks/use-iskur-appointments";
import { AppointmentSide } from "@/interfaces/appointment";
import { AppointmentRoleFilter } from "@/types/iskur-appointments";

const SIDE_ROLE = {
  [AppointmentSide.Mentor]: AppointmentRoleFilter.AsMentor,
  [AppointmentSide.Mentee]: AppointmentRoleFilter.AsMentee,
} as const;

const ROLE_CHIP = {
  [AppointmentRoleFilter.AsMentor]:
    "bg-brand-mentor-bg text-brand-mentor-strong",
  [AppointmentRoleFilter.AsMentee]: "bg-background-selected text-text-accent",
} as const;

const LEGEND = [
  AppointmentRoleFilter.AsMentor,
  AppointmentRoleFilter.AsMentee,
] as const;

/**
 * Randevularım for students who both give and take peer mentoring: the shared screen with a role filter on top and
 * a "Mentor olarak / Mentee olarak" chip on every appointment. Everyone else gets the shared screen unchanged.
 */
export function IskurAppointmentsView({ sentTo }: { sentTo: string | null }) {
  const t = useTranslations("iaIskur.appointments");
  const roles = useIskurAppointmentsRole();

  if (!roles.enabled) return <StudentAppointmentsView sentTo={sentTo} />;
  return (
    <StudentAppointmentsView
      sentTo={sentTo}
      filter={roles.filter}
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label={t("filterLabel")}
            className="flex flex-wrap gap-2"
          >
            {roles.roles.map((role) => {
              const selected = role === roles.role;
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => roles.setRole(role)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 type-label focus-visible:outline-2 focus-visible:outline-border-selected ${
                    selected
                      ? "border-brand-odtu-primary bg-background-selected text-text-accent"
                      : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
                  }`}
                >
                  {selected ? <Check aria-hidden className="size-3.5" /> : null}
                  {t(`roles.${role}`)}
                </button>
              );
            })}
          </div>
          <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGEND.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <dt>
                  <RoleChip role={role} />
                </dt>
                <dd className="type-caption text-text-muted">
                  {t(`legend.${role}`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      }
      renderActions={(appointment) => (
        <RoleChip role={SIDE_ROLE[appointment.side]} />
      )}
    />
  );
}

function RoleChip({ role }: { role: (typeof LEGEND)[number] }) {
  const t = useTranslations("iaIskur.appointments.roles");
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 type-label-sm ${ROLE_CHIP[role]}`}
    >
      {t(role)}
    </span>
  );
}
