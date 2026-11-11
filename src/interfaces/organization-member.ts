export type OrganizationMember = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId?: string;
  /** Null for a personal team (Organization.visibleName), which is never shown as a team. */
  organizationName?: string | null;
  jobTitle?: string | null;
  founder?: boolean;
  joinedAt?: string | null;
};

export type OrganizationMemberInput = {
  fullName: string;
  email: string;
  jobTitle?: string | undefined;
};

export type OrganizationMemberUpdate = {
  fullName: string;
  jobTitle?: string | undefined;
};

/** A teammate listed at signup who has not joined with the invite code yet. */
export type OrganizationPendingMember = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  createdAt: string;
};
