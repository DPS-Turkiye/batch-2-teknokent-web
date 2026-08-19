export type DemoSession = {
  userId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  organizationId: string;
  organizationName: string;
};

export type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MENTEE" | "MENTOR";
  organizationId?: string | null;
  organizationName?: string | null;
  jobTitle?: string | null;
};

export type SessionData = {
  user?: DemoSession;
};
