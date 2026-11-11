import { getLocale } from "next-intl/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session/route";
import {
  IdentityKind,
  UserAccountStatus,
  UserRole,
  type BackendUser,
} from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { fetchSignedInUser, saveSignedInLanguage } from "@/lib/api/auth";
import { Locale } from "@/lib/i18n";
import { LAST_WORKSPACE_COOKIE, saveSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));

const cookieValues = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
  })),
}));

vi.mock("@/lib/api/auth", () => ({
  fetchSignedInUser: vi.fn(),
  saveSignedInLanguage: vi.fn(),
}));

vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  saveSessionUser: vi.fn(),
}));

function signIn() {
  return POST(
    new NextRequest("http://localhost/api/session", {
      method: "POST",
      headers: { Authorization: "Bearer token-1" },
      body: JSON.stringify({ rememberMe: false }),
    }),
  );
}

function backendUser(status: UserAccountStatus): BackendUser {
  return {
    id: "user-1",
    email: "selin@mentor.co",
    fullName: "Selin Aydın",
    role: UserRole.Mentor,
    status,
  };
}

/** The user the last sign-in saved into the session cookie. */
function savedSessionUser() {
  const [user] = vi.mocked(saveSessionUser).mock.lastCall ?? [];
  if (!user) throw new Error("The sign-in did not save a session user.");
  return user;
}

function answers(user: BackendUser) {
  vi.mocked(fetchSignedInUser).mockResolvedValue({
    status: 200,
    data: user,
    headers: {},
  });
}

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocale).mockResolvedValue(Locale.En);
    vi.mocked(saveSignedInLanguage).mockResolvedValue({
      status: 204,
      data: undefined,
      headers: {},
    });
  });

  it("saves the language the person signs in with", async () => {
    answers(backendUser(UserAccountStatus.Approved));

    const response = await signIn();

    expect(response.status).toBe(200);
    expect(saveSignedInLanguage).toHaveBeenCalledWith("token-1", Locale.En);
    expect(saveSessionUser).toHaveBeenCalled();
  });

  it("saves it for a pending applicant too, whose decision notification comes later", async () => {
    answers(backendUser(UserAccountStatus.Pending));

    const response = await signIn();

    expect(response.status).toBe(403);
    expect(saveSignedInLanguage).toHaveBeenCalledWith("token-1", Locale.En);
  });

  it("still signs in when the language cannot be saved", async () => {
    answers(backendUser(UserAccountStatus.Approved));
    vi.mocked(saveSignedInLanguage).mockRejectedValue(new Error("down"));

    const response = await signIn();

    expect(response.status).toBe(200);
    expect(saveSessionUser).toHaveBeenCalled();
  });

  it("opens the workspace the account last switched to, if it can still open it", async () => {
    answers({
      id: "user-2",
      email: "elif@odtu-dev.invalid",
      fullName: "Elif Şahin",
      role: UserRole.Academician,
      status: UserAccountStatus.Approved,
      permissions: [UserRole.Mentee, UserRole.Academician],
      institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
    });
    cookieValues.set(LAST_WORKSPACE_COOKIE, Workspace.OdtuStudent);

    await signIn();
    expect(savedSessionUser().activeWorkspace).toBe(Workspace.OdtuStudent);

    vi.mocked(saveSessionUser).mockClear();
    cookieValues.set(LAST_WORKSPACE_COOKIE, Workspace.Admin);
    await signIn();
    expect(savedSessionUser().activeWorkspace).toBeUndefined();
    cookieValues.clear();
  });
});
