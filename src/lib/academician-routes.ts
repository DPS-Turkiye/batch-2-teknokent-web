/** The academician workspace's pages, in one place so a moved screen changes one line. */
export const ACADEMICIAN_ROUTES = {
  home: "/academician",
  appointments: "/academician/appointments",
  // Folded into Randevularım by the IA redesign; they stay until their replacement screens land.
  requests: "/academician/requests",
  calendar: "/academician/calendar",
  advisees: "/academician/advisees",
  profile: "/academician/profile",
} as const;
