import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/meetings/[id]/reschedule-proposals/route";
import { proposeReschedule } from "@/lib/api/meeting-proposals";
import { getSessionIds } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/meeting-proposals", () => ({ proposeReschedule: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const params = { params: Promise.resolve({ id: "meeting-1" }) };
const body = (value: unknown) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(value),
  });

describe("meeting reschedule route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answerEachWith([proposeReschedule], backendResponse({}, 201));
  });

  it("proposes as the signed-in user, passing only the time and length", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentor-1",
      organizationId: "",
    });

    await POST(
      body({
        scheduledAt: "2026-10-02T11:00:00Z",
        durationMinutes: 45,
        actorId: "someone-else",
      }),
      params,
    );

    expect(proposeReschedule).toHaveBeenCalledWith("mentor-1", "meeting-1", {
      scheduledAt: "2026-10-02T11:00:00Z",
      durationMinutes: 45,
    });
  });

  it("needs a session", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    expect((await POST(body({}), params)).status).toBe(401);
    expect(proposeReschedule).not.toHaveBeenCalled();
  });
});
