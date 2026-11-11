import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { fetchMeetings } from "@/lib/api/meetings";
import {
  fetchMentorRequest,
  fetchMentorRequests,
} from "@/lib/api/mentor-requests";
import { fetchRegularMentorships } from "@/lib/api/mentorships";
import { fetchPrograms } from "@/lib/api/programs";
import {
  requireMeetingAccess,
  requireOwnedMeeting,
  resolveGuestMentor,
  resolveMentorMeetingOrganization,
} from "@/lib/server/mentor-meeting";
import tr from "@/messages/tr.json";
import { program, programMentor } from "@test/fixtures/program";
import { backendRefusal, backendResponse } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meetings", () => ({ fetchMeetings: vi.fn() }));
vi.mock("@/lib/api/mentor-requests", () => ({
  fetchMentorRequest: vi.fn(),
  fetchMentorRequests: vi.fn(),
}));
vi.mock("@/lib/api/mentorships", () => ({
  fetchRegularMentorships: vi.fn(),
}));
vi.mock("@/lib/api/programs", () => ({ fetchPrograms: vi.fn() }));

const MENTOR = "mentor-1";

function regularMentorship(organizationId: string): RegularMentorship {
  return {
    id: `ms-${organizationId}`,
    mentorId: MENTOR,
    mentorName: "Leyla Aksoy",
    organizationId,
    organizationName: "Orbit",
    status: "ACTIVE",
    startDate: "2026-09-01",
    endDate: null,
    daysPerWeek: 1,
    goals: null,
    goalItems: [],
    progressPercent: 0,
  };
}

/** The program MENTOR joined, with org-1 in it and a second, accepted mentor. */
function joinedProgram(overrides: Partial<Program> = {}): Program {
  return program({
    startups: [{ id: "org-1", name: "Orbit" }],
    mentors: [
      programMentor({ mentorId: MENTOR }),
      programMentor({ mentorId: "mentor-2" }),
      programMentor({
        mentorId: "mentor-3",
        status: ProgramMentorStatus.Pending,
      }),
    ],
    ...overrides,
  });
}

/** The refusal a helper answers, or a failure when it let the caller through. */
async function refusalOf(result: { error: Response } | object) {
  if (!("error" in result)) throw new Error("expected a refusal");
  return { status: result.error.status, body: await result.error.json() };
}

describe("resolveMentorMeetingOrganization", () => {
  beforeEach(() => {
    vi.mocked(fetchMentorRequest).mockReset();
    vi.mocked(fetchMentorRequests).mockReset();
    vi.mocked(fetchRegularMentorships).mockReset();
    vi.mocked(fetchPrograms).mockReset();
  });

  describe("from a mentorship request", () => {
    it("books for the request's startup with no other mentors", async () => {
      vi.mocked(fetchMentorRequest).mockResolvedValue(
        backendResponse({ organizationId: "org-7" }),
      );

      const result = await resolveMentorMeetingOrganization(
        { mentorshipRequestId: "req-1", organizationId: "org-spoofed" },
        MENTOR,
      );

      expect(fetchMentorRequest).toHaveBeenCalledWith("req-1");
      expect(result).toEqual({ organizationId: "org-7", otherMentorIds: [] });
    });

    it("passes the backend's refusal of the request through", async () => {
      vi.mocked(fetchMentorRequest).mockResolvedValue(
        backendRefusal(404, { code: "NOT_FOUND" }),
      );

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { mentorshipRequestId: "req-1" },
          MENTOR,
        ),
      );

      expect(refusal).toEqual({ status: 404, body: { code: "NOT_FOUND" } });
    });

    it("ignores an empty request id and checks the startup instead", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(
        backendResponse([regularMentorship("org-1")]),
      );

      const result = await resolveMentorMeetingOrganization(
        { mentorshipRequestId: "", organizationId: "org-1" },
        MENTOR,
      );

      expect(fetchMentorRequest).not.toHaveBeenCalled();
      expect(result).toEqual({ organizationId: "org-1", otherMentorIds: [] });
    });
  });

  describe("from a startup outside any program", () => {
    it("books for a startup the mentor has a regular mentorship with", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(
        backendResponse([regularMentorship("org-1")]),
      );

      const result = await resolveMentorMeetingOrganization(
        { organizationId: "org-1" },
        MENTOR,
      );

      expect(fetchRegularMentorships).toHaveBeenCalledWith({
        mentorId: MENTOR,
      });
      expect(fetchMentorRequests).not.toHaveBeenCalled();
      expect(result).toEqual({ organizationId: "org-1", otherMentorIds: [] });
    });

    it("books for a startup whose request the mentor accepted", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(
        backendResponse([regularMentorship("org-other")]),
      );
      vi.mocked(fetchMentorRequests).mockResolvedValue(
        backendResponse([
          { organizationId: "org-1", status: MentorshipRequestStatus.Accepted },
        ]),
      );

      const result = await resolveMentorMeetingOrganization(
        { organizationId: "org-1", programId: "" },
        MENTOR,
      );

      expect(fetchMentorRequests).toHaveBeenCalledWith({
        requesterId: MENTOR,
        role: UserRole.Mentor,
      });
      expect(result).toEqual({ organizationId: "org-1", otherMentorIds: [] });
    });

    it("still checks the requests when the regular mentorships fail to load", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(backendRefusal(502));
      vi.mocked(fetchMentorRequests).mockResolvedValue(
        backendResponse([
          { organizationId: "org-1", status: MentorshipRequestStatus.Accepted },
        ]),
      );

      const result = await resolveMentorMeetingOrganization(
        { organizationId: "org-1" },
        MENTOR,
      );

      expect(result).toEqual({ organizationId: "org-1", otherMentorIds: [] });
    });

    it("refuses a startup whose request is only pending", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(backendResponse([]));
      vi.mocked(fetchMentorRequests).mockResolvedValue(
        backendResponse([
          { organizationId: "org-1", status: MentorshipRequestStatus.Pending },
        ]),
      );

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal).toEqual({
        status: 403,
        body: {
          code: "FORBIDDEN",
          message: tr.apiErrors.noActiveMentorship,
        },
      });
    });

    it("refuses when neither list loads, rather than letting the mentor through", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(backendRefusal(502));
      vi.mocked(fetchMentorRequests).mockResolvedValue(backendRefusal(502));

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal.status).toBe(403);
    });

    it("treats empty lists from the backend as no mentorship", async () => {
      vi.mocked(fetchRegularMentorships).mockResolvedValue(
        backendResponse(null),
      );
      vi.mocked(fetchMentorRequests).mockResolvedValue(backendResponse(null));

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal.status).toBe(403);
    });
  });

  describe("from a program", () => {
    it.each([
      ["nothing", {}],
      ["only a program", { programId: "prog-1" }],
      ["a non-string startup", { programId: "prog-1", organizationId: 7 }],
    ])(
      "asks for a startup when the payload names %s",
      async (_label, payload) => {
        const refusal = await refusalOf(
          await resolveMentorMeetingOrganization(payload, MENTOR),
        );

        expect(refusal).toEqual({
          status: 400,
          body: {
            code: "INVALID_REQUEST",
            message: tr.apiErrors.meetingStartupRequired,
          },
        });
        expect(fetchPrograms).not.toHaveBeenCalled();
      },
    );

    it("books for the program's startup and names the program's other accepted mentors", async () => {
      vi.mocked(fetchPrograms).mockResolvedValue(
        backendResponse([joinedProgram()]),
      );

      const result = await resolveMentorMeetingOrganization(
        { programId: "prog-1", organizationId: "org-1" },
        MENTOR,
      );

      expect(fetchPrograms).toHaveBeenCalledWith(MENTOR);
      expect(result).toEqual({
        organizationId: "org-1",
        otherMentorIds: ["mentor-2"],
      });
    });

    it("passes the backend's refusal of the program list through", async () => {
      vi.mocked(fetchPrograms).mockResolvedValue(backendRefusal(503));

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { programId: "prog-1", organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal.status).toBe(503);
    });

    it("refuses a program the mentor is not in", async () => {
      vi.mocked(fetchPrograms).mockResolvedValue(
        backendResponse([joinedProgram({ id: "prog-2" })]),
      );

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { programId: "prog-1", organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal).toEqual({
        status: 403,
        body: { code: "FORBIDDEN", message: tr.apiErrors.notInProgram },
      });
    });

    it("refuses a program the mentor was invited to but has not accepted", async () => {
      vi.mocked(fetchPrograms).mockResolvedValue(
        backendResponse([
          joinedProgram({
            mentors: [
              programMentor({
                mentorId: MENTOR,
                status: ProgramMentorStatus.Pending,
              }),
            ],
          }),
        ]),
      );

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { programId: "prog-1", organizationId: "org-1" },
          MENTOR,
        ),
      );

      expect(refusal.status).toBe(403);
    });

    it("refuses a startup that is not in the program", async () => {
      vi.mocked(fetchPrograms).mockResolvedValue(
        backendResponse([joinedProgram()]),
      );

      const refusal = await refusalOf(
        await resolveMentorMeetingOrganization(
          { programId: "prog-1", organizationId: "org-9" },
          MENTOR,
        ),
      );

      expect(refusal).toEqual({
        status: 400,
        body: {
          code: "INVALID_REQUEST",
          message: tr.apiErrors.startupNotInProgram,
        },
      });
    });
  });
});

describe("requireOwnedMeeting", () => {
  beforeEach(() => {
    vi.mocked(fetchMeetings).mockReset();
  });

  it("finds the meeting among the mentor's own", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(
      backendResponse([{ id: "meet-1" }, { id: "meet-2" }]),
    );

    const result = await requireOwnedMeeting(MENTOR, "meet-2");

    expect(fetchMeetings).toHaveBeenCalledWith({ mentorId: MENTOR });
    expect(result).toEqual({ meeting: { id: "meet-2" } });
  });

  it("answers 404 for a meeting that is not the mentor's", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(
      backendResponse([{ id: "meet-1" }]),
    );

    const refusal = await refusalOf(await requireOwnedMeeting(MENTOR, "x"));

    expect(refusal).toEqual({
      status: 404,
      body: { code: "NOT_FOUND", message: tr.apiErrors.meetingNotFound },
    });
  });

  it("answers 404 when the backend lists no meetings at all", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(backendResponse(null));

    const refusal = await refusalOf(await requireOwnedMeeting(MENTOR, "x"));

    expect(refusal.status).toBe(404);
  });

  it("passes the backend's refusal of the list through", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(backendRefusal(500));

    const refusal = await refusalOf(
      await requireOwnedMeeting(MENTOR, "meet-1"),
    );

    expect(refusal.status).toBe(500);
  });
});

describe("requireMeetingAccess", () => {
  beforeEach(() => {
    vi.mocked(fetchMeetings).mockReset();
  });

  it("looks a mentor's meeting up among the mentor's own", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(
      backendResponse([{ id: "meet-1" }]),
    );

    const result = await requireMeetingAccess(
      appSession({ userId: MENTOR, role: UserRole.Mentor }),
      "meet-1",
    );

    expect(fetchMeetings).toHaveBeenCalledTimes(1);
    expect(fetchMeetings).toHaveBeenCalledWith({ mentorId: MENTOR });
    expect(result).toEqual({ meeting: { id: "meet-1" } });
  });

  it("does not fall back to a startup for a mentor without a team", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(backendResponse([]));

    const refusal = await refusalOf(
      await requireMeetingAccess(
        appSession({ userId: MENTOR, role: UserRole.Mentor }),
        "meet-1",
      ),
    );

    expect(refusal.status).toBe(404);
    expect(fetchMeetings).toHaveBeenCalledTimes(1);
  });

  it("looks a team member's meeting up among the startup's", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(
      backendResponse([{ id: "meet-1" }]),
    );

    const result = await requireMeetingAccess(
      appSession({ organizationId: "org-1" }),
      "meet-1",
    );

    expect(fetchMeetings).toHaveBeenCalledWith({ organizationId: "org-1" });
    expect(result).toEqual({ meeting: { id: "meet-1" } });
  });

  it("reaches a team meeting for an account that both mentors and is on a team", async () => {
    vi.mocked(fetchMeetings)
      .mockResolvedValueOnce(backendResponse([{ id: "mentored" }]))
      .mockResolvedValueOnce(backendResponse([{ id: "team-meeting" }]));

    const result = await requireMeetingAccess(
      appSession({
        userId: "user-1",
        organizationId: "org-1",
        permissions: [UserRole.Mentor, UserRole.Mentee],
      }),
      "team-meeting",
    );

    expect(vi.mocked(fetchMeetings).mock.calls).toEqual([
      [{ mentorId: "user-1" }],
      [{ organizationId: "org-1" }],
    ]);
    expect(result).toEqual({ meeting: { id: "team-meeting" } });
  });

  it("stops at the mentor side when it already holds the meeting", async () => {
    vi.mocked(fetchMeetings).mockResolvedValue(
      backendResponse([{ id: "mentored" }]),
    );

    const result = await requireMeetingAccess(
      appSession({
        organizationId: "org-1",
        permissions: [UserRole.Mentor, UserRole.Mentee],
      }),
      "mentored",
    );

    expect(fetchMeetings).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ meeting: { id: "mentored" } });
  });

  it.each([
    ["a mentee without a startup", appSession()],
    ["a coordinator", appSession({ role: UserRole.Coordinator })],
  ])("refuses %s without asking the backend", async (_label, session) => {
    const refusal = await refusalOf(
      await requireMeetingAccess(session, "meet-1"),
    );

    expect(refusal).toEqual({
      status: 403,
      body: { code: "FORBIDDEN", message: tr.apiErrors.meetingNotEditable },
    });
    expect(fetchMeetings).not.toHaveBeenCalled();
  });
});

describe("resolveGuestMentor", () => {
  beforeEach(() => {
    vi.mocked(fetchPrograms).mockReset();
  });

  it.each([
    ["no guest", ""],
    ["the mentor themselves", MENTOR],
  ])("asks for another mentor when given %s", async (_label, guestId) => {
    const refusal = await refusalOf(await resolveGuestMentor(MENTOR, guestId));

    expect(refusal).toEqual({
      status: 400,
      body: {
        code: "INVALID_REQUEST",
        message: tr.apiErrors.mentorToAddRequired,
      },
    });
    expect(fetchPrograms).not.toHaveBeenCalled();
  });

  it("accepts a guest who mentors in a program with the mentor", async () => {
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([joinedProgram()]),
    );

    expect(await resolveGuestMentor(MENTOR, "mentor-2")).toEqual({
      guestId: "mentor-2",
    });
  });

  it("refuses a guest who has not accepted the shared program", async () => {
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([joinedProgram()]),
    );

    const refusal = await refusalOf(
      await resolveGuestMentor(MENTOR, "mentor-3"),
    );

    expect(refusal).toEqual({
      status: 403,
      body: { code: "FORBIDDEN", message: tr.apiErrors.noSharedProgram },
    });
  });

  it("refuses a guest who mentors only in programs the mentor is not in", async () => {
    vi.mocked(fetchPrograms).mockResolvedValue(
      backendResponse([
        joinedProgram({ mentors: [programMentor({ mentorId: MENTOR })] }),
        joinedProgram({
          id: "prog-2",
          mentors: [programMentor({ mentorId: "mentor-2" })],
        }),
      ]),
    );

    const refusal = await refusalOf(
      await resolveGuestMentor(MENTOR, "mentor-2"),
    );

    expect(refusal.status).toBe(403);
  });

  it("passes the backend's refusal of the program list through", async () => {
    vi.mocked(fetchPrograms).mockResolvedValue(backendRefusal(502));

    const refusal = await refusalOf(
      await resolveGuestMentor(MENTOR, "mentor-2"),
    );

    expect(refusal.status).toBe(502);
  });
});
