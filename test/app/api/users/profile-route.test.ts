import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/users/profile/route";
import { fetchUserProfile, updateUserProfile } from "@/lib/api/user-profile";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/user-profile", () => ({
  fetchUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

function session(): AppSession {
  return {
    userId: "user-1",
    email: "gulse@dongu.co",
    fullName: "Gülse Buran",
    jobTitle: "Designer",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Döngü",
  };
}

function profile() {
  return {
    id: "user-1",
    fullName: "Gülse Buran",
    email: "gulse@dongu.co",
    jobTitle: "Designer",
    phone: null,
    bio: "Ürün odaklı kurucu",
    linkedinUrl: null,
    expertise: ["UI/UX"],
  };
}

describe("/api/users/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET rejects a request without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchUserProfile).not.toHaveBeenCalled();
  });

  it("GET loads the signed-in user's own profile", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session());
    vi.mocked(fetchUserProfile).mockResolvedValue({
      data: profile(),
      status: 200,
    } as Awaited<ReturnType<typeof fetchUserProfile>>);

    const response = await GET();

    expect(fetchUserProfile).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      bio: "Ürün odaklı kurucu",
    });
  });

  it("PUT rejects a request without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ fullName: "Gülse Buran" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  // The backend refuses anything but self, so the route must take the user from
  // the session rather than from the request body.
  it("PUT saves against the session user, not the body", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session());
    vi.mocked(updateUserProfile).mockResolvedValue({
      data: profile(),
      status: 200,
    } as Awaited<ReturnType<typeof updateUserProfile>>);

    const response = await PUT(
      new Request("http://localhost/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ fullName: "Gülse Buran", id: "someone-else" }),
      }),
    );

    expect(updateUserProfile).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ fullName: "Gülse Buran" }),
    );
    expect(response.status).toBe(200);
  });
});
