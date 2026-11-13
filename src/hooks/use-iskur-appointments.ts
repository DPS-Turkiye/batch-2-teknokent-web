"use client";

import { useState } from "react";

import { usePeerMentorGate } from "@/hooks/use-peer-mentor-give";
import type { Appointment } from "@/interfaces/appointment";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import { matchesAppointmentRole } from "@/lib/iskur-appointments";
import { AppointmentRoleFilter } from "@/types/iskur-appointments";

const ROLES = [
  AppointmentRoleFilter.All,
  AppointmentRoleFilter.AsMentor,
  AppointmentRoleFilter.AsMentee,
] as const;

/**
 * Randevularım's "Tümü / Mentor olarak / Mentee olarak" filter. Only students who can give peer mentoring (İŞKUR
 * students and peer mentors) have both sides, so everyone else gets the list unfiltered and no filter row.
 */
export function useIskurAppointmentsRole() {
  const gate = usePeerMentorGate();
  const [role, setRole] = useState(AppointmentRoleFilter.All);
  const enabled = gate.state !== PeerMentorGateState.Hidden;
  return {
    enabled,
    roles: ROLES,
    role,
    setRole,
    filter: enabled
      ? (appointment: Appointment) => matchesAppointmentRole(appointment, role)
      : undefined,
  };
}
