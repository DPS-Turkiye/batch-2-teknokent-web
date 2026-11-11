import { beforeEach, expect, it, vi } from "vitest";

import { GET } from "@/app/api/programs/mine/this-week/route";
import { UserRole } from "@/interfaces/session";
import { fetchProgramThisWeek } from "@/lib/api/program-weeks";
import { getSessionUser } from "@/lib/session";
import { answerEachWith } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/program-weeks", () => ({ fetchProgramThisWeek: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  answerEachWith([fetchProgramThisWeek]);
});

it("needs a session", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(fetchProgramThisWeek).not.toHaveBeenCalled();
});

it("asks for the signed-in participant's own program", async () => {
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "mentee-1",
    email: "ayse@tekno.test",
    fullName: "Ayşe Yılmaz",
    jobTitle: "",
    role: UserRole.Mentee,
  });
  expect((await GET()).status).toBe(200);
  expect(fetchProgramThisWeek).toHaveBeenCalledWith("mentee-1");
});
