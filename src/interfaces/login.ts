export enum LoginFlowStep {
  Roles = "roles",
  Login = "login",
  Verifying = "verifying",
  Verified = "verified",
}

export enum LoginRoleId {
  Admin = "admin",
  ProgramManager = "program-manager",
  Mentor = "mentor",
  Trainer = "trainer",
  StartupOwner = "startup-owner",
  Mentee = "mentee",
}

export interface LoginRoleOption {
  id: LoginRoleId;
  label: string;
  description: string;
}

export interface LoginRoleGroup {
  id: string;
  title: string;
  description: string;
  roles: LoginRoleOption[];
}
