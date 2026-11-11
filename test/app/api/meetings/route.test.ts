import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/meetings/route";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { fetchPrograms } from "@/lib/api/programs";
import { getSessionIds, getSessionUser } from "@/lib/session";
import { program, programMentor } from "@test/fixtures/program";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/meetings", () => ({
  fetchMeetings: vi.fn(),
  createMeeting: vi.fn(),
}));

vi.mock("@/lib/api/mentor-requests", () => ({
  fetchMentorRequest: vi.fn(),
}));

vi.mock("@/lib/api/programs", () => ({
  fetchPrograms: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionUser: vi.fn(),
}));

function listRequest(query = "") {
  return new NextRequest(`http://localhost/api/meetings${query}`);
}

describe("GET /api/meetings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMeetings).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });
  });

  it("scopes by mentorId for a mentor session, not organizationId", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentor-1",
      email: "leyla@teknokent.demo",
      fullName: "Leyla Aksoy",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
    });

    await GET(listRequest());

    expect(fetchMeetings).toHaveBeenCalledWith({ mentorId: "mentor-1" });
    expect(getSessionIds).not.toHaveBeenCalled();
  });

  it("scopes by organizationId for a mentee session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentee-1",
      email: "deniz@greenloop.demo",
      fullName: "Deniz Arslan",
      jobTitle: "Kurucu",
      organizationId: "org-1",
      organizationName: "GreenLoop",
      role: UserRole.Mentee,
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });

    await GET(listRequest());

    expect(fetchMeetings).toHaveBeenCalledWith({ organizationId: "org-1" });
  });
});

describe("GET /api/meetings for an account on both sides", () => {
  const peerMentor = {
    userId: "student-1",
    email: "zeynep@odtu-dev.invalid",
    fullName: "Zeynep Demir",
    jobTitle: "Mentee",
    organizationId: "team-of-one",
    role: UserRole.Mentee,
    permissions: [UserRole.Mentor, UserRole.Mentee],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMeetings).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });
    vi.mocked(getSessionUser).mockResolvedValue(peerMentor);
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "student-1",
      organizationId: "team-of-one",
    });
  });

  // "Mentorluk Ver" names its side; without it the primary role (mentee) decides, as before.
  it("lists the mentor side when the screen asks for it", async () => {
    await GET(listRequest("?as=MENTOR"));
    expect(fetchMeetings).toHaveBeenCalledWith({ mentorId: "student-1" });
  });

  it("stays on the mentee side by default", async () => {
    await GET(listRequest());
    expect(fetchMeetings).toHaveBeenCalledWith({
      organizationId: "team-of-one",
    });
  });

  it("never gives a side the account does not hold", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      ...peerMentor,
      permissions: [UserRole.Mentee],
    });
    await GET(listRequest("?as=MENTOR"));
    expect(fetchMeetings).not.toHaveBeenCalledWith({ mentorId: "student-1" });
  });
});

describe("POST /api/meetings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createMeeting).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  function signInAsMentor() {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentor-1",
      email: "leyla@teknokent.demo",
      fullName: "Leyla Aksoy",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
    });
  }

  it("resolves the organization from the chosen mentorship, not the session", async () => {
    signInAsMentor();
    // A mentor has no organization of their own, so org-1 from the session
    // must not be used; it comes from the mentorship being scheduled.
    vi.mocked(fetchMentorRequest).mockResolvedValue({
      data: { organizationId: "org-greenloop" },
      headers: {},
      status: 200,
    });

    await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          mentorshipRequestId: "req-1",
          agenda: "Mentor: Leyla Aksoy",
        }),
      }),
    );

    expect(fetchMentorRequest).toHaveBeenCalledWith("req-1");
    expect(createMeeting).toHaveBeenCalledWith(
      "org-greenloop",
      { mentorshipRequestId: "req-1", agenda: "Mentor: Leyla Aksoy" },
      "mentor-1",
    );
  });

  it("refuses a mentor meeting with no mentorship or program startup", async () => {
    signInAsMentor();

    const response = await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({ agenda: "Imported event" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createMeeting).not.toHaveBeenCalled();
  });

  it("resolves the organization from a program startup the mentor joined", async () => {
    signInAsMentor();
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([
        program({
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [programMentor({ mentorId: "mentor-1" })],
        }),
      ]),
    );

    await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          programId: "prog-1",
          organizationId: "org-greenloop",
          agenda: "Mentor: Leyla Aksoy",
        }),
      }),
    );

    expect(fetchMentorRequest).not.toHaveBeenCalled();
    expect(createMeeting).toHaveBeenCalledWith(
      "org-greenloop",
      {
        programId: "prog-1",
        organizationId: "org-greenloop",
        agenda: "Mentor: Leyla Aksoy",
      },
      "mentor-1",
    );
  });

  it("also creates the meeting for other accepted mentors in the program", async () => {
    signInAsMentor();
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([
        program({
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [
            programMentor({ mentorId: "mentor-1" }),
            programMentor({ mentorId: "mentor-2" }),
            programMentor({
              mentorId: "mentor-3",
              status: ProgramMentorStatus.Pending,
            }),
          ],
        }),
      ]),
    );

    await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          programId: "prog-1",
          organizationId: "org-greenloop",
          agenda: "Mentor: Leyla Aksoy",
        }),
      }),
    );

    expect(createMeeting).toHaveBeenCalledTimes(2);
    expect(createMeeting).toHaveBeenNthCalledWith(
      2,
      "org-greenloop",
      expect.objectContaining({ programId: "prog-1" }),
      "mentor-2",
    );
  });

  it("refuses a program startup when the mentor has not joined", async () => {
    signInAsMentor();
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([
        program({
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [],
        }),
      ]),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          programId: "prog-1",
          organizationId: "org-greenloop",
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(createMeeting).not.toHaveBeenCalled();
  });

  it("does not attach a mentorId for a mentee creating a meeting", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentee-1",
      email: "deniz@greenloop.demo",
      fullName: "Deniz Arslan",
      jobTitle: "Kurucu",
      organizationId: "org-1",
      organizationName: "GreenLoop",
      role: UserRole.Mentee,
    });

    await POST(
      new NextRequest("http://localhost/api/meetings", {
        method: "POST",
        body: JSON.stringify({ agenda: "Imported event" }),
      }),
    );

    expect(createMeeting).toHaveBeenCalledWith(
      "org-1",
      { agenda: "Imported event" },
      undefined,
    );
  });
});
