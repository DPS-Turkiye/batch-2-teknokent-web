import type { OrganizationProgram } from "@/interfaces/program";

/** A startup-mentoring program the mentee's organization is in. */
export function organizationProgram(
  id: string,
  name: string,
  overrides: Partial<OrganizationProgram> = {},
): OrganizationProgram {
  return {
    id,
    name,
    coordinatorName: "Elif",
    individualMentees: false,
    ...overrides,
  };
}
