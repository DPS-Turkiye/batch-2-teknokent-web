import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/meetings/route";
import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { fetchPrograms } from "@/lib/api/programs";
import { ProgramMentorStatus } from "@/interfaces/program";
import { getSessionIds, getSessionUser } from "@/lib/session";

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

    await GET();

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

    await GET();

    expect(fetchMeetings).toHaveBeenCalledWith({ organizationId: "org-1" });
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
    vi.mocked(fetchPrograms).mockResolvedValue({
      data: [
        {
          id: "prog-1",
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [
            {
              mentorId: "mentor-1",
              status: ProgramMentorStatus.Accepted,
            },
          ],
        },
      ],
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchPrograms>>);

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
    vi.mocked(fetchPrograms).mockResolvedValue({
      data: [
        {
          id: "prog-1",
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [
            {
              mentorId: "mentor-1",
              status: ProgramMentorStatus.Accepted,
            },
            {
              mentorId: "mentor-2",
              status: ProgramMentorStatus.Accepted,
            },
            {
              mentorId: "mentor-3",
              status: ProgramMentorStatus.Pending,
            },
          ],
        },
      ],
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchPrograms>>);

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
    vi.mocked(fetchPrograms).mockResolvedValue({
      data: [
        {
          id: "prog-1",
          startups: [{ id: "org-greenloop", name: "GreenLoop" }],
          mentors: [],
        },
      ],
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchPrograms>>);

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
