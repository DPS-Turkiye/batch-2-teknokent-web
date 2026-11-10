import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session/refresh/route";
import {
  type AppSession,
  type BackendUser,
  UserAccountStatus,
  UserRole,
} from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { fetchSignedInUser } from "@/lib/api/auth";
import { HttpMethod } from "@/lib/http-method";
import { getSessionUser, refreshSessionUser } from "@/lib/session";

vi.mock("@/lib/api/auth", () => ({ fetchSignedInUser: vi.fn() }));
vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
  refreshSessionUser: vi.fn(),
}));

const SESSION = {
  userId: "student-1",
  email: "mehmet@odtu.test",
  fullName: "Mehmet Kaya",
  jobTitle: "",
  role: UserRole.Mentee,
  permissions: [UserRole.Mentee],
  activeWorkspace: Workspace.OdtuStudent,
} as AppSession;

function request(token: string | null = "firebase-token") {
  return new NextRequest(new URL("/api/session/refresh", "http://localhost"), {
    method: HttpMethod.Post,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function backendUser(overrides: Partial<BackendUser> = {}) {
  return {
    data: {
      id: "student-1",
      email: "mehmet@odtu.test",
      fullName: "Mehmet Kaya",
      role: UserRole.Mentee,
      status: UserAccountStatus.Approved,
      ...overrides,
    } as BackendUser,
    headers: {},
    status: 200,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(SESSION);
  vi.mocked(fetchSignedInUser).mockResolvedValue(backendUser());
  vi.mocked(refreshSessionUser).mockResolvedValue({
    ...SESSION,
    permissions: [UserRole.Mentee, UserRole.Mentor],
  });
});

describe("POST /api/session/refresh", () => {
  it("re-reads the account and keeps the open workspace", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchSignedInUser).toHaveBeenCalledWith("firebase-token");
    expect(refreshSessionUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "student-1" }),
      Workspace.OdtuStudent,
    );
    expect((await response.json()).permissions).toContain(UserRole.Mentor);
  });

  it("needs a session and a Firebase token", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(401);
    expect((await POST(request(null))).status).toBe(400);
    expect(refreshSessionUser).not.toHaveBeenCalled();
  });

  it("never swaps the session to another account or one no longer approved", async () => {
    vi.mocked(fetchSignedInUser).mockResolvedValueOnce(
      backendUser({ id: "someone-else" }),
    );
    expect((await POST(request())).status).toBe(403);
    vi.mocked(fetchSignedInUser).mockResolvedValueOnce(
      backendUser({ status: UserAccountStatus.Pending }),
    );
    expect((await POST(request())).status).toBe(403);
    expect(refreshSessionUser).not.toHaveBeenCalled();
  });
});
