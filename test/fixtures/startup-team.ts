import type { OrganizationMember } from "@/interfaces/organization-member";

export function memberFixture(
  id: string,
  overrides: Partial<OrganizationMember> = {},
): OrganizationMember {
  return {
    id,
    email: `${id}@dongu.co`,
    fullName: "Kerem Aksoy",
    role: "MENTEE",
    organizationId: "org-1",
    jobTitle: "CTO",
    founder: false,
    joinedAt: "2026-06-12T09:00:00Z",
    ...overrides,
  };
}
