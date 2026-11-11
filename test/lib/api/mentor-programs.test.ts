import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMentorPrograms,
  saveMentorPrograms,
} from "@/lib/api/mentor-programs";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("mentor onboarding programs server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads the programs the onboarding mentor picked, signed with their token", async () => {
    await fetchMentorPrograms("id-token");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "GET", url: "/api/onboarding/mentor-programs" },
      { idToken: "id-token" },
    ]);
  });

  it("saves the picked program ids, signed with the token", async () => {
    await saveMentorPrograms("id-token", ["prog-1", "prog-2"]);

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "PUT",
        url: "/api/onboarding/mentor-programs",
        data: { programIds: ["prog-1", "prog-2"] },
      },
      { idToken: "id-token" },
    ]);
  });
});
