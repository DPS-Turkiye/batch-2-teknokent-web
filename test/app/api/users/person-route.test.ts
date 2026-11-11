import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getPersonProfile } from "@/app/api/users/[id]/profile/route";
import { GET as getPerson } from "@/app/api/users/[id]/route";
import { UserRole, type BackendUser } from "@/interfaces/session";
import type { UserProfile } from "@/interfaces/user-profile";
import { fetchUser } from "@/lib/api/accounts";
import { fetchUserProfile } from "@/lib/api/user-profile";
import type { BackendResponse } from "@/lib/server/backend-client";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/accounts", () => ({ fetchUser: vi.fn() }));
vi.mock("@/lib/api/user-profile", () => ({ fetchUserProfile: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const person: BackendUser = {
  id: "person-2",
  email: "kisi@example.test",
  fullName: "Örnek Kişi",
  role: UserRole.Mentee,
  organizationId: "org-1",
  organizationName: "Örnek Girişim",
  jobTitle: null,
};

const profile: UserProfile = {
  id: "person-2",
  fullName: "Örnek Kişi",
  email: "kisi@example.test",
  jobTitle: null,
  phone: null,
  bio: "Ürün odaklı kurucu",
  linkedinUrl: null,
  expertise: [],
  contactPreferences: [],
};

function answer<T>(data: T, status = 200): BackendResponse<T> {
  return { data, headers: {}, status };
}

// The id in the query is what a browser could forge; the routes must ignore it.
const request = new NextRequest(
  "http://localhost/api/users/person-2?actorId=someone-else",
);
const params = { params: Promise.resolve({ id: "person-2" }) };

describe("/api/users/[id] and /api/users/[id]/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "viewer-1",
      organizationId: "org-1",
    });
  });

  it("refuses the account without a session and never asks the backend", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await getPerson(request, params);

    expect(response.status).toBe(401);
    expect(fetchUser).not.toHaveBeenCalled();
  });

  it("refuses the profile without a session and never asks the backend", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await getPersonProfile(request, params);

    expect(response.status).toBe(401);
    expect(fetchUserProfile).not.toHaveBeenCalled();
  });

  it("asks for the account as the session user, not the forged actor", async () => {
    vi.mocked(fetchUser).mockResolvedValue(answer(person));

    const response = await getPerson(request, params);

    expect(fetchUser).toHaveBeenCalledWith("person-2", "viewer-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(person);
  });

  it("asks for the profile as the session user, not the forged actor", async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue(answer(profile));

    const response = await getPersonProfile(request, params);

    expect(fetchUserProfile).toHaveBeenCalledWith("person-2", "viewer-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(profile);
  });

  it("passes the backend's not found through for someone unrelated", async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue(answer(profile, 404));

    const response = await getPersonProfile(request, params);

    expect(response.status).toBe(404);
  });
});
