import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as postManualProfile } from "@/app/api/profile-analysis/manual/route";
import { GET as getProfileAnalysis } from "@/app/api/profile-analysis/route";
import { UserRole } from "@/interfaces/session";
import {
  createManualProfileAnalysis,
  fetchLatestProfileAnalysis,
} from "@/lib/api/profile-analysis";
import { getSessionIds, getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/programs", () => ({ fetchPrograms: vi.fn() }));
vi.mock("@/lib/api/profile-analysis", () => ({
  fetchLatestProfileAnalysis: vi.fn(),
  createManualProfileAnalysis: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
  getSessionUser: vi.fn(),
}));

// A signed-in mentee who has no startup yet. Its organization is blank, and the backend used to read a blank
// list filter as "no filter" and answer with every row on the platform.
describe("a session without a startup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "student-1",
      organizationId: "",
    });
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "student-1",
      email: "ogrenci@odtu.example",
      fullName: "Öğrenci",
      jobTitle: "",
      role: UserRole.Mentee,
    });
  });

  // Without an organization the backend falls back to the seeded demo startup.
  it("cannot read or write a startup profile analysis", async () => {
    const read = await getProfileAnalysis(
      new NextRequest("http://localhost/api/profile-analysis"),
    );
    const write = await postManualProfile(
      new NextRequest("http://localhost/api/profile-analysis/manual", {
        method: "POST",
        body: JSON.stringify({ summary: "x" }),
      }),
    );

    expect(read.status).toBe(403);
    expect(write.status).toBe(403);
    expect(fetchLatestProfileAnalysis).not.toHaveBeenCalled();
    expect(createManualProfileAnalysis).not.toHaveBeenCalled();
  });
});
