import type { OrganizationMember } from "@/interfaces/organization-member";
import { isEmailAddress } from "@/lib/utils";

export enum MemberFormMode {
  Add = "add",
  Edit = "edit",
}

export type MemberDraft = {
  mode: MemberFormMode;
  memberId: string | null;
  fullName: string;
  email: string;
  jobTitle: string;
};

export function foundersFirst(members: OrganizationMember[]) {
  return [...members].sort(
    (left, right) =>
      Number(Boolean(right.founder)) - Number(Boolean(left.founder)),
  );
}

/** The first problem with a draft (a `startupTeam.errors` key), or null when it can be sent. */
/** Only the founder may see or renew the startup's invite code. */
export function isFounder(members: OrganizationMember[], userId?: string) {
  return members.some((member) => member.founder && member.id === userId);
}

export function memberDraftError(draft: MemberDraft) {
  if (!draft.fullName.trim()) return "nameRequired" as const;
  if (draft.mode === MemberFormMode.Add && !isEmailAddress(draft.email)) {
    return "emailInvalid" as const;
  }
  return null;
}
