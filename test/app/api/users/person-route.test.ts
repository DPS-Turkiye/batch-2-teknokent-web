import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET as getPerson } from "@/app/api/users/[id]/route";
import { GET as getPersonProfile } from "@/app/api/users/[id]/profile/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchUser } from "@/lib/api/accounts";
import { fetchUserProfile } from "@/lib/api/user-profile";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/accounts", () => ({ fetchUser: vi.fn() }));
vi.mock("@/lib/api/user-profile", () => ({ fetchUserProfile: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

function session(): AppSession {
  return {
    userId: "viewer-1",
    email: "viewer@example.test",
    fullName: "Örnek Kişi",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Örnek Girişim",
  };
}

const request = new NextRequest("http://localhost/api/users/person-2");
const params = { params: Promise.resolve({ id: "person-2" }) };

describe("/api/users/[id] and /api/users/[id]/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["the account", getPerson, fetchUser],
    ["the profile", getPersonProfile, fetchUserProfile],
  ] as const)(
    "%s needs a session before asking the backend",
    async (_name, handler, fetcher) => {
      vi.mocked(getSessionUser).mockResolvedValue(null);

      const response = await handler(request, params);

      expect(response.status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  // The backend decides who may see whom, so it has to know who is asking.
  it("asks for the account as the signed-in user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session());
    vi.mocked(fetchUser).mockResolvedValue({
      data: { id: "person-2" },
      status: 200,
    } as Awaited<ReturnType<typeof fetchUser>>);

    const response = await getPerson(request, params);

    expect(fetchUser).toHaveBeenCalledWith("person-2", "viewer-1");
    expect(response.status).toBe(200);
  });

  it("asks for the profile as the signed-in user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session());
    vi.mocked(fetchUserProfile).mockResolvedValue({
      data: { id: "person-2" },
      status: 200,
    } as Awaited<ReturnType<typeof fetchUserProfile>>);

    const response = await getPersonProfile(request, params);

    expect(fetchUserProfile).toHaveBeenCalledWith("person-2", "viewer-1");
    expect(response.status).toBe(200);
  });

  it("passes the backend's not found through for someone unrelated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session());
    vi.mocked(fetchUserProfile).mockResolvedValue({
      data: { message: "User not found: person-2" },
      status: 404,
    } as Awaited<ReturnType<typeof fetchUserProfile>>);

    const response = await getPersonProfile(request, params);

    expect(response.status).toBe(404);
  });
});
