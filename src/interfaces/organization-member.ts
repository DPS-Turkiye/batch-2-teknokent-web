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
