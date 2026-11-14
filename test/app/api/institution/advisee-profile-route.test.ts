import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/institution/me/advisees/[userId]/profile/route";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { fetchAdviseeProfile } from "@/lib/api/institution";
import { getSessionUser } from "@/lib/session";
import { backendRefusal, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/institution", () => ({ fetchAdviseeProfile: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const SESSION = {
  userId: "academician-1",
  email: "elif@odtu-dev.invalid",
  fullName: "Elif Şahin",
  jobTitle: "",
  role: UserRole.Academician,
};
const STUDENT = "0b9e2f4a-1c3d-4e5f-8a6b-7c8d9e0f1a2b";
const PROFILE = {
  interests: {
    topics: [PeerTopicCategory.CareerInternship],
    subtopics: ["cv"],
  },
  goal: "Yaz stajı bulmak",
};

function call(userId: string, query = "") {
  return GET(new NextRequest(new URL(`/x${query}`, "http://localhost")), {
    params: Promise.resolve({ userId }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(SESSION);
  vi.mocked(fetchAdviseeProfile).mockResolvedValue(backendResponse(PROFILE));
});

describe("GET /api/institution/me/advisees/[userId]/profile", () => {
  it("asks as the session's academician and passes the profile through", async () => {
    const response = await call(STUDENT);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(PROFILE);
    expect(fetchAdviseeProfile).toHaveBeenCalledWith("academician-1", STUDENT);
  });

  it("never takes the actor from the request", async () => {
    await call(STUDENT, "?actorId=someone-else");

    expect(fetchAdviseeProfile).toHaveBeenCalledWith("academician-1", STUDENT);
  });

  it("answers 401 without a session and asks nothing", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await call(STUDENT)).status).toBe(401);
    expect(fetchAdviseeProfile).not.toHaveBeenCalled();
  });

  it.each(["..", "student-1", `${STUDENT}/../x`])(
    "answers 400 for %s before asking the backend",
    async (userId) => {
      const response = await call(userId);

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ fields: ["userId"] });
      expect(fetchAdviseeProfile).not.toHaveBeenCalled();
    },
  );

  it("passes the backend's 404 on for someone else's student", async () => {
    vi.mocked(fetchAdviseeProfile).mockResolvedValue(
      backendRefusal(404, { message: "Advisee not found." }),
    );

    expect((await call(STUDENT)).status).toBe(404);
  });
});
