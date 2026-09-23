export type OrganizationMember = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  jobTitle?: string;
  founder?: boolean;
  joinedAt?: string | null;
};

export type OrganizationMemberInput = {
  fullName: string;
  email: string;
  jobTitle?: string;
};

export type OrganizationMemberUpdate = {
  fullName: string;
  jobTitle?: string;
};

/** A teammate listed at signup who has not joined with the invite code yet. */
export type OrganizationPendingMember = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  createdAt: string;
};
