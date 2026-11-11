import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfileInput } from "@/interfaces/user-profile";
import { fetchUserProfile, updateUserProfile } from "@/lib/api/user-profile";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const profile: UserProfileInput = {
  fullName: "Ada Yılmaz",
  jobTitle: null,
  phone: null,
  bio: "Fintech",
  linkedinUrl: null,
  expertise: ["Fonlama"],
};

describe("user profile server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads an encoded user's profile with the server's own credentials", async () => {
    await fetchUserProfile("user/1");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "GET", url: "/api/users/user%2F1/profile" },
      undefined,
    ]);
  });

  it("reads the profile signed with the onboarding token when one is given", async () => {
    await fetchUserProfile("user/1", "id-token");

    expect(vi.mocked(backendRequest).mock.lastCall?.[1]).toEqual({
      idToken: "id-token",
    });
  });

  it("saves the profile as the user themselves, the only actor the backend accepts", async () => {
    await updateUserProfile("user/1", profile);

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "PUT",
        url: "/api/users/user%2F1/profile",
        data: { actorId: "user/1", ...profile },
      },
      undefined,
    ]);
  });

  it("signs the save with the onboarding token when one is given", async () => {
    await updateUserProfile("user/1", profile, "id-token");

    expect(vi.mocked(backendRequest).mock.lastCall?.[1]).toEqual({
      idToken: "id-token",
    });
  });
});
