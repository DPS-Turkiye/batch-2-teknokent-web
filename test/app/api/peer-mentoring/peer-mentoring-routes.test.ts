import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getMentorCounts } from "@/app/api/peer-mentoring/mentor-counts/route";
import { GET as getMentor } from "@/app/api/peer-mentoring/mentors/[mentorId]/route";
import { GET as getMentors } from "@/app/api/peer-mentoring/mentors/route";
import {
  GET as getRequests,
  POST as postRequest,
} from "@/app/api/peer-mentoring/requests/route";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerTopicCategory,
  type PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  createPeerMentoringRequest,
  fetchPeerMentor,
  fetchPeerMentorCounts,
  fetchPeerMentoringRequests,
  fetchPeerMentors,
} from "@/lib/api/peer-mentoring";
import { getSessionUser } from "@/lib/session";
import { peerMentorDetailFixture } from "@test/fixtures/peer-mentoring";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/peer-mentoring", () => ({
  fetchPeerMentor: vi.fn(),
  fetchPeerMentorCounts: vi.fn(),
  fetchPeerMentors: vi.fn(),
  fetchPeerMentoringRequests: vi.fn(),
  createPeerMentoringRequest: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const sentRequest: PeerMentoringRequest = {
  id: "peer-request-1",
  mentor: { userId: "mentor-1", fullName: "Deniz Kara", department: null },
  mentee: { userId: "student-1", fullName: "Ayşe Yılmaz", department: null },
  category: PeerTopicCategory.International,
  message: "Erasmus başvurusu için nereden başlamalıyım?",
  status: MentorshipRequestStatus.Pending,
  createdAt: "2026-11-06T10:15:00+03:00",
};

const mentorDetail = peerMentorDetailFixture("fixture-peer-1");
if (!mentorDetail) throw new Error("fixture mentor missing");

function request(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost"), init);
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
  vi.mocked(fetchPeerMentors).mockResolvedValue(backendResponse([]));
  vi.mocked(fetchPeerMentor).mockResolvedValue(backendResponse(mentorDetail));
  vi.mocked(fetchPeerMentorCounts).mockResolvedValue(backendResponse([]));
  vi.mocked(fetchPeerMentoringRequests).mockResolvedValue(backendResponse([]));
  vi.mocked(createPeerMentoringRequest).mockResolvedValue(
    backendResponse(sentRequest, 201),
  );
});

describe("peer-mentoring proxy routes", () => {
  it("need a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect(
      (await getMentors(request("/api/peer-mentoring/mentors"))).status,
    ).toBe(401);
    expect(fetchPeerMentors).not.toHaveBeenCalled();
  });

  it("ask for the signed-in student's program mentors, passing only known categories", async () => {
    await getMentors(
      request(
        "/api/peer-mentoring/mentors?category=INTERNATIONAL&q=%20erasmus%20",
      ),
    );
    expect(fetchPeerMentors).toHaveBeenCalledWith("student-1", {
      category: PeerTopicCategory.International,
      q: "erasmus",
    });

    await getMentors(
      request("/api/peer-mentoring/mentors?category=DROP%20TABLE"),
    );
    expect(fetchPeerMentors).toHaveBeenLastCalledWith("student-1", {
      category: undefined,
      q: undefined,
    });
  });

  it("pass a sub-topic and this-week filter, and drop an over-long sub-topic or any other flag value", async () => {
    await getMentors(
      request(
        "/api/peer-mentoring/mentors?subTopic=%20fixture-cv%20&availableThisWeek=true",
      ),
    );
    expect(fetchPeerMentors).toHaveBeenLastCalledWith("student-1", {
      category: undefined,
      q: undefined,
      subTopic: "fixture-cv",
      availableThisWeek: true,
    });

    await getMentors(
      request(
        `/api/peer-mentoring/mentors?subTopic=${"x".repeat(65)}&availableThisWeek=1`,
      ),
    );
    expect(fetchPeerMentors).toHaveBeenLastCalledWith("student-1", {
      category: undefined,
      q: undefined,
      subTopic: undefined,
      availableThisWeek: undefined,
    });
  });

  it("read one mentor for the signed-in student only, and refuse an id that isn't a uuid", async () => {
    const mentorId = "8c5f0f0e-6a3e-4c55-9d2d-2a7c7b1f0a11";
    const params = (id: string) => ({
      params: Promise.resolve({ mentorId: id }),
    });

    expect(
      (await getMentor(new Request("http://localhost"), params(mentorId)))
        .status,
    ).toBe(200);
    expect(fetchPeerMentor).toHaveBeenCalledWith("student-1", mentorId);

    const refused = await getMentor(
      new Request("http://localhost"),
      params("../profile"),
    );
    expect(refused.status).toBe(400);
    expect(fetchPeerMentor).toHaveBeenCalledTimes(1);

    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect(
      (await getMentor(new Request("http://localhost"), params(mentorId)))
        .status,
    ).toBe(401);
    expect(fetchPeerMentor).toHaveBeenCalledTimes(1);
  });

  it("read the mentor counts for the signed-in student", async () => {
    expect((await getMentorCounts()).status).toBe(200);
    expect(fetchPeerMentorCounts).toHaveBeenCalledWith("student-1");

    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await getMentorCounts()).status).toBe(401);
    expect(fetchPeerMentorCounts).toHaveBeenCalledTimes(1);
  });

  it("list the student's own requests unless the mentor side is asked for", async () => {
    await getRequests(request("/api/peer-mentoring/requests"));
    expect(fetchPeerMentoringRequests).toHaveBeenCalledWith(
      "student-1",
      UserRole.Mentee,
    );
    await getRequests(request("/api/peer-mentoring/requests?as=MENTOR"));
    expect(fetchPeerMentoringRequests).toHaveBeenLastCalledWith(
      "student-1",
      UserRole.Mentor,
    );
  });

  it("send a request as the signed-in student, whatever actor the body names", async () => {
    const response = await postRequest(
      request("/api/peer-mentoring/requests", {
        method: "POST",
        body: JSON.stringify({
          actorId: "someone-else",
          mentorId: "peer-1",
          category: PeerTopicCategory.CareerInternship,
          message: "Staj başvurusu için CV'me bakar mısın?",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createPeerMentoringRequest).toHaveBeenCalledWith("student-1", {
      mentorId: "peer-1",
      category: PeerTopicCategory.CareerInternship,
      message: "Staj başvurusu için CV'me bakar mısın?",
    });
  });
});
