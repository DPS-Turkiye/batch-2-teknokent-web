import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProgramEventKind,
  type CreateProgramInput,
  type UpdateProgramDetailsInput,
} from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import { ApprovalKind } from "@/interfaces/program-approvals";
import {
  addProgramCoordinator,
  addProgramEligibleEmails,
  addProgramTeams,
  cancelMentorInvite,
  createCoordinatorProgram,
  createCoordinatorProgramEvent,
  createMatch,
  decideProgramApproval,
  decideProgramMentor,
  extractSyllabusPhases,
  fetchCoordinatorProgram,
  fetchCoordinatorPrograms,
  fetchMatching,
  fetchMatchSuggestions,
  fetchMentorPool,
  fetchMentorReview,
  fetchProgramApprovals,
  fetchProgramCoordinators,
  fetchProgramEligibleEmails,
  fetchProgramTeamDetail,
  fetchProgramTeams,
  fetchProgramWithoutTeam,
  inviteProgramMentor,
  launchCoordinatorProgram,
  removeProgramCoordinator,
  removeProgramEligibleEmail,
  removeProgramTeam,
  renewMentorInvite,
  replaceCoordinatorProgramPhases,
  sendProgramTeamCode,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
  updateProgramTeam,
  withdrawProgramMentorInvite,
} from "@/lib/api/coordinator-programs";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

// Ids with a slash and a space prove every path segment is encoded, so an id
// can never climb into another backend route.
const ACTOR = "coord-1";
const PROGRAM = "prog/1";
const PROGRAM_URL = "/api/coordinator/programs/prog%2F1";

const details: UpdateProgramDetailsInput = {
  name: "Kuluçka 2026",
  description: null,
  startDate: "2026-01-05",
  endDate: null,
  meetingFrequencyDays: 14,
  staleAfterDays: 21,
  meetingNoteRequired: true,
  autoMatchSuggestions: false,
};

const newProgram: CreateProgramInput = {
  type: ProgramType.StartupMentoring,
  name: "Kuluçka 2026",
  description: null,
  startDate: null,
  endDate: null,
  coordinatorIds: [ACTOR],
  newCoordinators: [{ fullName: "Yeni Kişi", email: "yeni@teknokent.org" }],
};

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const programCases: RequestCase[] = [
  [
    "lists the coordinator's programs with the actor in the query",
    () => fetchCoordinatorPrograms(ACTOR),
    {
      method: "GET",
      url: "/api/coordinator/programs",
      params: { actorId: ACTOR },
    },
  ],
  [
    "reads one program at its encoded path",
    () => fetchCoordinatorProgram(ACTOR, PROGRAM),
    { method: "GET", url: PROGRAM_URL, params: { actorId: ACTOR } },
  ],
  [
    "creates a program with the actor added to the body",
    () => createCoordinatorProgram(ACTOR, newProgram),
    {
      method: "POST",
      url: "/api/coordinator/programs",
      data: { ...newProgram, actorId: ACTOR },
    },
  ],
  [
    "saves program details with the actor added to the body",
    () => updateCoordinatorProgram(ACTOR, PROGRAM, details),
    {
      method: "PUT",
      url: PROGRAM_URL,
      data: { ...details, actorId: ACTOR },
    },
  ],
  [
    "launches a program with the actor in the query",
    () => launchCoordinatorProgram(ACTOR, PROGRAM),
    {
      method: "POST",
      url: `${PROGRAM_URL}/launch`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "archives a program by sending archived=true",
    () => setCoordinatorProgramArchived(ACTOR, PROGRAM, true),
    {
      method: "PUT",
      url: `${PROGRAM_URL}/archive`,
      data: { actorId: ACTOR, archived: true },
    },
  ],
  [
    "adds an event with the actor added to the body",
    () =>
      createCoordinatorProgramEvent(ACTOR, PROGRAM, {
        title: "Demo Günü",
        kind: ProgramEventKind.Event,
        startsAt: "2026-03-01T10:00:00Z",
        endsAt: null,
        description: null,
      }),
    {
      method: "POST",
      url: `${PROGRAM_URL}/events`,
      data: {
        title: "Demo Günü",
        kind: ProgramEventKind.Event,
        startsAt: "2026-03-01T10:00:00Z",
        endsAt: null,
        description: null,
        actorId: ACTOR,
      },
    },
  ],
  [
    "asks the syllabus reader for phases with the actor added to the body",
    () =>
      extractSyllabusPhases(ACTOR, {
        documentId: "doc-1",
        startDate: "2026-01-05",
        endDate: "2026-06-01",
      }),
    {
      method: "POST",
      url: "/api/coordinator/programs/syllabus/phases",
      data: {
        documentId: "doc-1",
        startDate: "2026-01-05",
        endDate: "2026-06-01",
        actorId: ACTOR,
      },
    },
  ],
];

const peopleCases: RequestCase[] = [
  [
    "lists the program's coordinators",
    () => fetchProgramCoordinators(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/coordinators`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "lists coordinator candidates when asked for them",
    () => fetchProgramCoordinators(ACTOR, PROGRAM, true),
    {
      method: "GET",
      url: `${PROGRAM_URL}/coordinators/candidates`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "adds a coordinator by user id in the body",
    () => addProgramCoordinator(ACTOR, PROGRAM, "user 7"),
    {
      method: "POST",
      url: `${PROGRAM_URL}/coordinators`,
      data: { actorId: ACTOR, userId: "user 7" },
    },
  ],
  [
    "removes a coordinator by encoded user id in the path",
    () => removeProgramCoordinator(ACTOR, PROGRAM, "user 7"),
    {
      method: "DELETE",
      url: `${PROGRAM_URL}/coordinators/user%207`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "lists the eligible e-mail addresses",
    () => fetchProgramEligibleEmails(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/eligible-emails`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "adds eligible e-mail addresses in the body",
    () => addProgramEligibleEmails(ACTOR, PROGRAM, ["a@x.demo", "b@x.demo"]),
    {
      method: "POST",
      url: `${PROGRAM_URL}/eligible-emails`,
      data: { actorId: ACTOR, emails: ["a@x.demo", "b@x.demo"] },
    },
  ],
  [
    "removes an eligible e-mail entry by encoded id",
    () => removeProgramEligibleEmail(ACTOR, PROGRAM, "entry/1"),
    {
      method: "DELETE",
      url: `${PROGRAM_URL}/eligible-emails/entry%2F1`,
      params: { actorId: ACTOR },
    },
  ],
];

const teamCases: RequestCase[] = [
  [
    "lists the program's teams",
    () => fetchProgramTeams(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/teams`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "invites teams in the body",
    () =>
      addProgramTeams(ACTOR, PROGRAM, [
        { teamName: "Orbit", leadEmail: "lead@orbit.demo" },
      ]),
    {
      method: "POST",
      url: `${PROGRAM_URL}/teams`,
      data: {
        actorId: ACTOR,
        teams: [{ teamName: "Orbit", leadEmail: "lead@orbit.demo" }],
      },
    },
  ],
  [
    "edits a team invite with the actor in the query and only the invite in the body",
    () =>
      updateProgramTeam(ACTOR, PROGRAM, "inv 1", {
        teamName: "Orbit",
        leadEmail: "new@orbit.demo",
      }),
    {
      method: "PUT",
      url: `${PROGRAM_URL}/teams/inv%201`,
      params: { actorId: ACTOR },
      data: { teamName: "Orbit", leadEmail: "new@orbit.demo" },
    },
  ],
  [
    "removes a team invite by encoded id",
    () => removeProgramTeam(ACTOR, PROGRAM, "inv 1"),
    {
      method: "DELETE",
      url: `${PROGRAM_URL}/teams/inv%201`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "sends a team's join code again",
    () => sendProgramTeamCode(ACTOR, PROGRAM, "inv 1"),
    {
      method: "POST",
      url: `${PROGRAM_URL}/teams/inv%201/send-code`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "reads a joined team's details by encoded organization id",
    () => fetchProgramTeamDetail(ACTOR, PROGRAM, "org/9"),
    {
      method: "GET",
      url: `${PROGRAM_URL}/team-details/org%2F9`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "lists approved people still without a team",
    () => fetchProgramWithoutTeam(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/without-team`,
      params: { actorId: ACTOR },
    },
  ],
];

const mentorCases: RequestCase[] = [
  [
    "lists the mentor pool",
    () => fetchMentorPool(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/mentors`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "invites a mentor by e-mail in the body",
    () => inviteProgramMentor(ACTOR, PROGRAM, "mentor@x.demo"),
    {
      method: "POST",
      url: `${PROGRAM_URL}/mentors`,
      data: { actorId: ACTOR, email: "mentor@x.demo" },
    },
  ],
  [
    "withdraws a mentor invite by encoded mentor id",
    () => withdrawProgramMentorInvite(ACTOR, PROGRAM, "mentor 1"),
    {
      method: "DELETE",
      url: `${PROGRAM_URL}/mentors/mentor%201`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "reads a mentor's application for review",
    () => fetchMentorReview(ACTOR, PROGRAM, "mentor 1"),
    {
      method: "GET",
      url: `${PROGRAM_URL}/mentors/mentor%201/review`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "rejects a mentor by sending accepted=false",
    () => decideProgramMentor(ACTOR, PROGRAM, "mentor 1", false),
    {
      method: "POST",
      url: `${PROGRAM_URL}/mentors/mentor%201/decision`,
      data: { actorId: ACTOR, accepted: false },
    },
  ],
  [
    "renews an expired mentor invite",
    () => renewMentorInvite(ACTOR, PROGRAM, "inv/2"),
    {
      method: "POST",
      url: `${PROGRAM_URL}/mentor-invites/inv%2F2/renew`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "cancels a mentor invite",
    () => cancelMentorInvite(ACTOR, PROGRAM, "inv/2"),
    {
      method: "DELETE",
      url: `${PROGRAM_URL}/mentor-invites/inv%2F2`,
      params: { actorId: ACTOR },
    },
  ],
];

const approvalAndMatchingCases: RequestCase[] = [
  [
    "lists pending approvals",
    () => fetchProgramApprovals(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/approvals`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "decides an approval under its kind's path segment",
    () =>
      decideProgramApproval(
        ACTOR,
        PROGRAM,
        ApprovalKind.TeamChanges,
        "req 3",
        true,
      ),
    {
      method: "POST",
      url: `${PROGRAM_URL}/approvals/team-changes/req%203`,
      data: { actorId: ACTOR, accepted: true },
    },
  ],
  [
    "reads the matching overview",
    () => fetchMatching(ACTOR, PROGRAM),
    {
      method: "GET",
      url: `${PROGRAM_URL}/matching`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "reads match suggestions for one encoded startup",
    () => fetchMatchSuggestions(ACTOR, PROGRAM, "org/9"),
    {
      method: "GET",
      url: `${PROGRAM_URL}/matching/org%2F9/suggestions`,
      params: { actorId: ACTOR },
    },
  ],
  [
    "creates a match with the pair and the actor in the body",
    () =>
      createMatch(ACTOR, PROGRAM, {
        organizationId: "org-9",
        mentorId: "mentor-1",
      }),
    {
      method: "POST",
      url: `${PROGRAM_URL}/matching`,
      data: { organizationId: "org-9", mentorId: "mentor-1", actorId: ACTOR },
    },
  ],
];

describe("coordinator programs server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  describe("programs", () => {
    it.each(programCases)("%s", async (_description, call, request) => {
      await call();
      expect(backendRequest).toHaveBeenCalledWith(request);
    });
  });

  describe("coordinators and eligible e-mails", () => {
    it.each(peopleCases)("%s", async (_description, call, request) => {
      await call();
      expect(backendRequest).toHaveBeenCalledWith(request);
    });
  });

  describe("teams", () => {
    it.each(teamCases)("%s", async (_description, call, request) => {
      await call();
      expect(backendRequest).toHaveBeenCalledWith(request);
    });
  });

  describe("mentor pool", () => {
    it.each(mentorCases)("%s", async (_description, call, request) => {
      await call();
      expect(backendRequest).toHaveBeenCalledWith(request);
    });
  });

  describe("approvals and matching", () => {
    it.each(approvalAndMatchingCases)(
      "%s",
      async (_description, call, request) => {
        await call();
        expect(backendRequest).toHaveBeenCalledWith(request);
      },
    );
  });

  describe("replaceCoordinatorProgramPhases", () => {
    const phases = [
      { name: "Keşif", startDate: "2026-01-05", endDate: "2026-02-01" },
    ];

    it("sends a null syllabus document when the phases were typed by hand", async () => {
      await replaceCoordinatorProgramPhases(ACTOR, PROGRAM, phases);

      expect(backendRequest).toHaveBeenCalledWith({
        method: "PUT",
        url: `${PROGRAM_URL}/phases`,
        data: { actorId: ACTOR, phases, syllabusDocumentId: null },
      });
    });

    it("links the syllabus document the phases were read from", async () => {
      await replaceCoordinatorProgramPhases(ACTOR, PROGRAM, phases, "doc-1");

      expect(backendRequest).toHaveBeenCalledWith({
        method: "PUT",
        url: `${PROGRAM_URL}/phases`,
        data: { actorId: ACTOR, phases, syllabusDocumentId: "doc-1" },
      });
    });
  });

  it("hands back the backend's response unchanged", async () => {
    const response = { status: 404, data: { code: "NOT_FOUND" }, headers: {} };
    vi.mocked(backendRequest).mockResolvedValue(response);

    await expect(fetchCoordinatorProgram(ACTOR, PROGRAM)).resolves.toBe(
      response,
    );
  });
});
