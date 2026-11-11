import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/coordinator/programs/[id]/training/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchTrainingForEditor, saveTraining } from "@/lib/api/training";
import { getSessionUser } from "@/lib/session";
import { answerEachWith } from "@test/fixtures/route-handlers";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/training", () => ({
  fetchTrainingForEditor: vi.fn(),
  saveTraining: vi.fn(),
}));

const program = { params: Promise.resolve({ id: "p1" }) };
const as = (role: UserRole): AppSession => ({
  userId: `${role}-1`,
  email: "x@menton.test",
  fullName: "X",
  jobTitle: "x",
  role,
});

describe("training editor route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answerEachWith([fetchTrainingForEditor]);
    answerEachWith([saveTraining]);
  });

  it("is for coordinators and admins, acting as themselves", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect(
      (await GET(new NextRequest("http://localhost/x"), program)).status,
    ).toBe(403);
    expect(fetchTrainingForEditor).not.toHaveBeenCalled();

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    await PUT(
      new NextRequest("http://localhost/x", {
        method: "PUT",
        body: JSON.stringify({
          actorId: "someone-else",
          videoUrl: "https://youtu.be/x",
          questions: [],
        }),
      }),
      program,
    );
    expect(saveTraining).toHaveBeenCalledWith("COORDINATOR-1", "p1", {
      videoUrl: "https://youtu.be/x",
      questions: [],
    });
  });
});
