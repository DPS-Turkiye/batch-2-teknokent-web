import type { OrganizationMember } from "@/interfaces/organization-member";
import type { AppSession } from "@/interfaces/session";
import { initials } from "@/lib/utils";

export type RequestTeamMember = {
  id: string;
  initials: string;
  name: string;
  role: string;
};

export function memberDisplayRole(
  member: Pick<OrganizationMember, "jobTitle" | "role">,
) {
  const title = member.jobTitle?.trim();
  if (title) return title;
  if (member.role === "MENTEE") return "Mentee";
  return member.role || "Mentee";
}

export function teamMembersForMentorRequest(
  members: OrganizationMember[] | undefined,
  session: AppSession | null,
): RequestTeamMember[] {
  if (members?.length) {
    return members.map((member) => ({
      id: member.id,
      initials: initials(member.fullName) || "??",
      name: member.fullName,
      role: memberDisplayRole(member),
    }));
  }
  if (!session) return [];
  return [
    {
      id: session.userId,
      initials: initials(session.fullName) || "??",
      name: session.fullName,
      role: session.jobTitle?.trim() || "Mentee",
    },
  ];
}
