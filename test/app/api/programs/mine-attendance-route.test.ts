import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/programs/mine/attendance/route";
import { UserRole } from "@/interfaces/session";
import {
  checkInMyAttendance,
  fetchMyAttendance,
} from "@/lib/api/program-attendance";
import { requireStartupSession } from "@/lib/server/require-program-access";
import { answerEachWith, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-attendance", () => ({
  fetchMyAttendance: vi.fn(),
  checkInMyAttendance: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireStartupSession: vi.fn(),
}));

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/programs/mine/attendance", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/programs/mine/attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "mentee-1", role: UserRole.Mentee }),
    });
    answerEachWith([fetchMyAttendance, checkInMyAttendance]);
  });

  it("reads the session user's own check-in", async () => {
    expect((await GET()).status).toBe(200);
    expect(fetchMyAttendance).toHaveBeenCalledWith("mentee-1");
  });

  // The body names only the week; who checks in always comes from the session.
  it("checks in the session user, never an id from the body", async () => {
    await post({ week: 2, actorId: "someone-else" });

    expect(checkInMyAttendance).toHaveBeenCalledWith("mentee-1", 2);
  });

  it("refuses a missing or malformed week without asking the backend", async () => {
    for (const body of [{}, null, { week: "2" }, { week: 0 }, { week: 1.5 }]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(checkInMyAttendance).not.toHaveBeenCalled();
  });

  it("stops anyone without a startup session", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue(guardRefusal(401));

    expect((await GET()).status).toBe(401);
    expect((await post({ week: 2 })).status).toBe(401);
    expect(fetchMyAttendance).not.toHaveBeenCalled();
    expect(checkInMyAttendance).not.toHaveBeenCalled();
  });
});
