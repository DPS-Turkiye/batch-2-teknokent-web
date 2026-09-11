import type { OrganizationMember } from "@/interfaces/organization-member";

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The first problem with a draft, or null when it can be sent. */
export function memberDraftError(draft: MemberDraft) {
  if (!draft.fullName.trim()) return "Ad soyad gerekli.";
  if (
    draft.mode === MemberFormMode.Add &&
    !EMAIL_PATTERN.test(draft.email.trim())
  ) {
    return "Geçerli bir e-posta adresi gir.";
  }
  return null;
}
