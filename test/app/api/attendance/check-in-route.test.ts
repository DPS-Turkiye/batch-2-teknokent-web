import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/attendance/check-in/route";
import { checkInSession } from "@/lib/api/program-attendance";
import { getSessionIds } from "@/lib/session";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { answerEachWith, backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/program-attendance", () => ({ checkInSession: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const TOKEN = "Ab_-".repeat(10) + "xyz";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/attendance/check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "team-1",
    });
    answerEachWith([checkInSession]);
  });

  // The body names only the code; who is checked in always comes from the session.
  it("checks in the session user, never an id from the body", async () => {
    expect((await post(withForgedActor({ token: TOKEN }))).status).toBe(200);

    expect(checkInSession).toHaveBeenCalledWith("mentee-1", TOKEN);
  });

  it("refuses a visitor without a session before asking the backend", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    expect((await post({ token: TOKEN })).status).toBe(401);
    expect(checkInSession).not.toHaveBeenCalled();
  });

  it("passes the backend's refusal and its code through", async () => {
    vi.mocked(checkInSession).mockResolvedValue(
      backendRefusal(409, {
        code: "ATTENDANCE_QR_NOT_VALID",
        message: "Bu QR şu an geçerli değil.",
      }),
    );

    const response = await post({ token: TOKEN });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "ATTENDANCE_QR_NOT_VALID",
    });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(checkInSession).mockRejectedValue(new Error("down"));

    expect((await post({ token: TOKEN })).status).toBe(502);
  });
});
