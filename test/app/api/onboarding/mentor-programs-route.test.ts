import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/onboarding/mentor-programs/route";
import {
  fetchMentorPrograms,
  saveMentorPrograms,
} from "@/lib/api/mentor-programs";
import { tokenRequest } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/mentor-programs", () => ({
  fetchMentorPrograms: vi.fn(),
  saveMentorPrograms: vi.fn(),
}));

function request(options: { method: string; token?: string; body?: unknown }) {
  return tokenRequest(
    "http://localhost/api/onboarding/mentor-programs",
    options,
  );
}

describe("/api/onboarding/mentor-programs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMentorPrograms).mockResolvedValue({
      data: ["p1"],
      headers: {},
      status: 200,
    });
    vi.mocked(saveMentorPrograms).mockResolvedValue({
      data: ["p1"],
      headers: {},
      status: 200,
    });
  });

  it("refuses both calls without a Firebase token", async () => {
    expect((await GET(request({ method: "GET" }))).status).toBe(400);
    expect(
      (await PUT(request({ method: "PUT", body: { programIds: ["p1"] } })))
        .status,
    ).toBe(400);
    expect(fetchMentorPrograms).not.toHaveBeenCalled();
    expect(saveMentorPrograms).not.toHaveBeenCalled();
  });

  it("reads the mentor's programs with the token", async () => {
    const response = await GET(request({ method: "GET", token: "id-token" }));

    expect(response.status).toBe(200);
    expect(fetchMentorPrograms).toHaveBeenCalledWith("id-token");
  });

  it("sends the chosen program ids", async () => {
    await PUT(
      request({
        method: "PUT",
        token: "id-token",
        body: { programIds: ["p1", "p2"] },
      }),
    );

    expect(saveMentorPrograms).toHaveBeenCalledWith("id-token", ["p1", "p2"]);
  });

  it("refuses program ids that are not all strings", async () => {
    const response = await PUT(
      request({
        method: "PUT",
        token: "id-token",
        body: { programIds: ["p1", 7, null, "p2"] },
      }),
    );

    expect(response.status).toBe(400);
    expect(saveMentorPrograms).not.toHaveBeenCalled();
  });
});
