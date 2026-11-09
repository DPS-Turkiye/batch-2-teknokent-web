import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/student/profile-completion/route";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  fetchStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/api/student-profile-completion";
import { HttpMethod } from "@/lib/http-method";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/student-profile-completion", () => ({
  fetchStudentProfileCompletion: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const ok = { data: {}, headers: {}, status: 200 };

function put(body: unknown) {
  return new NextRequest(
    new URL("/api/student/profile-completion", "http://localhost"),
    { method: HttpMethod.Put, body: JSON.stringify(body) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "student-1",
    email: "ayse@odtu-dev.invalid",
    fullName: "Ayşe Yılmaz",
    jobTitle: "",
    role: UserRole.Mentee,
  });
  vi.mocked(fetchStudentProfileCompletion).mockResolvedValue(ok);
  vi.mocked(saveStudentProfileCompletion).mockResolvedValue(ok);
});

describe("student profile-completion proxy", () => {
  it("needs a session for reading and saving", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect((await PUT(put({ topics: [] }))).status).toBe(401);
    expect(fetchStudentProfileCompletion).not.toHaveBeenCalled();
    expect(saveStudentProfileCompletion).not.toHaveBeenCalled();
  });

  it("reads the signed-in student's own interests", async () => {
    await GET();
    expect(fetchStudentProfileCompletion).toHaveBeenCalledWith("student-1");
  });

  it("saves for the session user only, keeping known categories and real booleans", async () => {
    await PUT(
      put({
        actorId: "someone-else",
        topics: [PeerTopicCategory.International, "NOT_A_CATEGORY"],
        subtopics: ["fixture-exchange"],
        goal: "Erasmus",
        completed: "true",
        skipped: true,
      }),
    );

    expect(saveStudentProfileCompletion).toHaveBeenCalledWith("student-1", {
      topics: [PeerTopicCategory.International],
      subtopics: ["fixture-exchange"],
      goal: "Erasmus",
      completed: false,
      skipped: true,
    });
  });
});
