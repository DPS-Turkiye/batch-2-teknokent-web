import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as submit } from "@/app/api/training/peer/attempts/route";
import { GET as training } from "@/app/api/training/peer/route";
import { UserRole } from "@/interfaces/session";
import {
  fetchStudentTraining,
  submitTrainingAttempt,
} from "@/lib/api/training";
import { getSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/training", () => ({
  fetchStudentTraining: vi.fn(),
  submitTrainingAttempt: vi.fn(),
}));

const student = {
  userId: "student-1",
  email: "s@odtu-dev.invalid",
  fullName: "S",
  jobTitle: "x",
  role: UserRole.Mentee,
};

function post(body: unknown) {
  return new NextRequest("http://localhost/api/training/peer/attempts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("student training routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStudentTraining).mockResolvedValue({
      status: 200,
      data: {},
      headers: {},
    } as never);
    vi.mocked(submitTrainingAttempt).mockResolvedValue({
      status: 200,
      data: {},
      headers: {},
    } as never);
  });

  it("needs a session and acts as its student", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await training()).status).toBe(401);

    vi.mocked(getSessionUser).mockResolvedValue(student);
    await training();
    expect(fetchStudentTraining).toHaveBeenCalledWith("student-1");
    await submit(
      post({ actorId: "someone-else", version: 1, answers: { q1: 2 } }),
    );
    expect(submitTrainingAttempt).toHaveBeenCalledWith("student-1", 1, {
      q1: 2,
    });
  });

  it("refuses a malformed submission before the backend", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(student);
    expect(
      (await submit(post({ version: "1", answers: { q1: 2 } }))).status,
    ).toBe(400);
    expect(
      (await submit(post({ version: 1, answers: { q1: "2" } }))).status,
    ).toBe(400);
    expect(submitTrainingAttempt).not.toHaveBeenCalled();
  });
});
