import { beforeEach, expect, it, vi } from "vitest";

import { GET } from "@/app/api/programs/mine/weeks/route";
import { UserRole } from "@/interfaces/session";
import { fetchProgramWeeksSoFar } from "@/lib/api/program-weeks";
import { getSessionUser } from "@/lib/session";
import { answerEachWith, backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/program-weeks", () => ({
  fetchProgramWeeksSoFar: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const mentee = {
  userId: "mentee-1",
  email: "ayse@tekno.test",
  fullName: "Ayşe Yılmaz",
  jobTitle: "",
  role: UserRole.Mentee,
};

beforeEach(() => {
  vi.clearAllMocks();
  answerEachWith([fetchProgramWeeksSoFar]);
});

it("needs a session", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(fetchProgramWeeksSoFar).not.toHaveBeenCalled();
});

it("asks for the signed-in participant's own program", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(mentee);
  expect((await GET()).status).toBe(200);
  expect(fetchProgramWeeksSoFar).toHaveBeenCalledWith("mentee-1");
});

it("forwards the backend's refusal for someone outside the program", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(mentee);
  vi.mocked(fetchProgramWeeksSoFar).mockResolvedValue(
    backendRefusal(403, { code: "FORBIDDEN" }),
  );
  expect((await GET()).status).toBe(403);
});

it("answers 502 with a translated message when the backend can't be reached", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(mentee);
  vi.mocked(fetchProgramWeeksSoFar).mockRejectedValue(new Error("down"));
  const response = await GET();
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({
    message: "Geçmiş haftalar yüklenemedi.",
  });
});
