import {
  TeamChangeKind,
  TeamChangeStatus,
  type TeamChange,
} from "@/interfaces/team-change";

/** A member's pending request to leave Döngü. */
export function leaveRequestOf(
  memberId: string,
  overrides: Partial<TeamChange> = {},
): TeamChange {
  return {
    id: `tc-${memberId}`,
    kind: TeamChangeKind.Leave,
    status: TeamChangeStatus.Pending,
    organizationId: "org-1",
    organizationName: "Döngü",
    memberId,
    memberName: "Kerem Aksoy",
    memberEmail: `${memberId}@dongu.co`,
    requestedById: memberId,
    requestedByName: "Kerem Aksoy",
    createdAt: "2026-11-04T09:00:00Z",
    ...overrides,
  };
}
