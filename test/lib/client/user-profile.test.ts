import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfileInput } from "@/interfaces/user-profile";
import { backendHttp, signedInUserId } from "@/lib/client/backend-http";
import {
  getPerson,
  getPersonProfile,
  getUserProfile,
  saveUserProfile,
} from "@/lib/client/user-profile";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const OWN_PROFILE = "/api/users/user%2F1/profile";
const profile: UserProfileInput = {
  fullName: "Ada Yılmaz",
  jobTitle: null,
  phone: null,
  bio: "Fintech",
  linkedinUrl: null,
  expertise: ["Fonlama"],
};

describe("user profile client, straight to the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: profile,
    });
    vi.mocked(backendHttp.put).mockResolvedValue({
      status: 200,
      data: profile,
    });
  });

  it("reads the signed-in person's own profile on the tab's token", async () => {
    expect(await getUserProfile()).toEqual(profile);

    expect(backendHttp.get).toHaveBeenCalledWith(OWN_PROFILE, undefined);
    expect(signedInUserId).toHaveBeenCalledWith(undefined);
  });

  it("saves the profile as sent, naming nobody: the backend takes the actor from the token", async () => {
    await saveUserProfile(profile);

    expect(backendHttp.put).toHaveBeenCalledWith(
      OWN_PROFILE,
      profile,
      undefined,
    );
  });

  it("uses onboarding's own token, before the session exists, for the id and the call alike", async () => {
    await saveUserProfile(profile, "id-token");
    await getUserProfile("id-token");

    const signed = { headers: { Authorization: "Bearer id-token" } };
    expect(backendHttp.put).toHaveBeenCalledWith(OWN_PROFILE, profile, signed);
    expect(backendHttp.get).toHaveBeenCalledWith(OWN_PROFILE, signed);
    expect(signedInUserId).toHaveBeenCalledWith("id-token");
  });

  it("turns a refusal into an error", async () => {
    vi.mocked(backendHttp.put).mockResolvedValue({
      status: 400,
      data: { message: "Sadece kendi profilini düzenleyebilirsin." },
    });

    await expect(saveUserProfile(profile)).rejects.toThrow(
      "Sadece kendi profilini düzenleyebilirsin.",
    );
  });

  it("reads someone else's account and profile by their encoded id", async () => {
    await getPerson("u/2");
    await getPersonProfile("u/2");

    expect(backendHttp.get).toHaveBeenCalledWith("/api/users/u%2F2");
    expect(backendHttp.get).toHaveBeenCalledWith("/api/users/u%2F2/profile");
  });
});
