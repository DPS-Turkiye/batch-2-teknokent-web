import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/programs/mine/attendance/route";
import { UserRole } from "@/interfaces/session";
import { fetchMyAttendance } from "@/lib/api/program-attendance";
import { requireStartupSession } from "@/lib/server/require-program-access";
import { answerEachWith, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-attendance", () => ({
  fetchMyAttendance: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireStartupSession: vi.fn(),
}));

describe("/api/programs/mine/attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "mentee-1", role: UserRole.Mentee }),
    });
    answerEachWith([fetchMyAttendance]);
  });

  it("reads the session user's own attendance", async () => {
    expect((await GET()).status).toBe(200);
    expect(fetchMyAttendance).toHaveBeenCalledWith("mentee-1");
  });

  it("stops anyone without a startup session", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue(guardRefusal(401));

    expect((await GET()).status).toBe(401);
    expect(fetchMyAttendance).not.toHaveBeenCalled();
  });
});
