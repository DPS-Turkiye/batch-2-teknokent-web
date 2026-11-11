import {
  UserRole,
  type AppSession,
  type BackendUser,
} from "@/interfaces/session";

/** A signed-in user, as the session cookie holds them; a mentee unless overridden. */
export function appSession(overrides: Partial<AppSession> = {}): AppSession {
  return {
    userId: "user-1",
    email: "user@menton.test",
    fullName: "Test User",
    jobTitle: "",
    role: UserRole.Mentee,
    ...overrides,
  };
}

/** An account as the backend describes it; a mentee unless overridden. */
export function backendUser(overrides: Partial<BackendUser> = {}): BackendUser {
  return {
    id: "user-1",
    email: "user@menton.test",
    fullName: "Test User",
    role: UserRole.Mentee,
    ...overrides,
  };
}
