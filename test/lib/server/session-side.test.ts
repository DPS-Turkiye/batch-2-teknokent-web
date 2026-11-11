import { describe, expect, it } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { sessionSide } from "@/lib/server/session-side";

function account(role: UserRole, permissions?: UserRole[]): AppSession {
  const session: AppSession = {
    userId: "u-1",
    email: "u@menton.test",
    fullName: "U",
    jobTitle: "x",
    role,
  };
  if (permissions !== undefined) session.permissions = permissions;
  return session;
}

describe("sessionSide", () => {
  it("keeps single-role accounts on their own side", () => {
    expect(sessionSide(account(UserRole.Mentor))).toBe(UserRole.Mentor);
    expect(sessionSide(account(UserRole.Mentee))).toBe(UserRole.Mentee);
    expect(sessionSide(account(UserRole.Mentor), UserRole.Mentee)).toBeNull();
  });

  it("lets an account on both sides name either", () => {
    const both = account(UserRole.Mentee, [UserRole.Mentor, UserRole.Mentee]);
    expect(sessionSide(both)).toBe(UserRole.Mentee);
    expect(sessionSide(both, UserRole.Mentor)).toBe(UserRole.Mentor);
    expect(sessionSide(both, "SOMETHING")).toBe(UserRole.Mentee);
  });

  it("gives staff no mentoring side", () => {
    expect(sessionSide(account(UserRole.Coordinator))).toBeNull();
  });
});
