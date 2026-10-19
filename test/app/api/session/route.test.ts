import { NextRequest } from "next/server";
import { getLocale } from "next-intl/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session/route";
import {
  UserAccountStatus,
  UserRole,
  type BackendUser,
} from "@/interfaces/session";
import { fetchSignedInUser, saveSignedInLanguage } from "@/lib/api/auth";
import { Locale } from "@/lib/i18n";
import { saveSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({ getLocale: vi.fn() }));

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
});
