import { beforeEach, describe, vi } from "vitest";

import {
  ProgramEventKind,
  type CreateProgramEventInput,
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
  getCoordinatorProgram,
  getCoordinatorPrograms,
  getMatching,
  getMatchSuggestions,
  getMentorPool,
  getMentorReview,
  getProgramApprovals,
  getProgramCoordinators,
  getProgramEligibleEmails,
  getProgramTeamDetail,
  getProgramTeams,
  getProgramWithoutTeam,
  inviteProgramCoordinator,
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
} from "@/lib/client/coordinator-programs";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Ids with a slash and a space prove every path segment is encoded, so an id can never reach another route.
const PROGRAM = "prog/1 a";
const P = "/api/coordinator/programs/prog%2F1%20a";
const TEAM_INVITE = { teamName: "Acme", leadEmail: "lead@acme.test" };
const PHASE = {
  name: "Keşif",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
};
const EVENT: CreateProgramEventInput = {
  title: "Demo Day",
  kind: ProgramEventKind.Event,
  startsAt: "2026-02-01T10:00:00Z",
  endsAt: null,
  description: null,
};
const DETAILS: UpdateProgramDetailsInput = {
  name: "Yeni ad",
  description: null,
  startDate: null,
  endDate: null,
  meetingFrequencyDays: 14,
  staleAfterDays: 21,
  meetingNoteRequired: true,
  autoMatchSuggestions: false,
};
const NEW_PROGRAM: CreateProgramInput = {
  type: ProgramType.StartupMentoring,
  name: "Bahar",
  description: null,
  startDate: null,
  endDate: null,
  coordinatorIds: ["coord-1"],
  newCoordinators: [],
};

const calls: ClientCall[] = [
  {
    title: "getCoordinatorPrograms lists the coordinator's programs",
    call: () => getCoordinatorPrograms(),
    method: "get",
    args: ["/api/coordinator/programs"],
  },
  {
    title: "createCoordinatorProgramEvent posts the event under the program",
    call: () => createCoordinatorProgramEvent(PROGRAM, EVENT),
    method: "post",
    args: [`${P}/events`, EVENT],
  },
  {
    title: "getCoordinatorProgram reads one program by its encoded id",
    call: () => getCoordinatorProgram(PROGRAM),
    method: "get",
    args: [P],
  },
  {
    title: "updateCoordinatorProgram puts the new details",
    call: () => updateCoordinatorProgram(PROGRAM, DETAILS),
    method: "put",
    args: [P, DETAILS],
  },
  {
    title:
      "replaceCoordinatorProgramPhases sends the phases with no syllabus by default",
    call: () => replaceCoordinatorProgramPhases(PROGRAM, [PHASE]),
    method: "put",
    args: [`${P}/phases`, { phases: [PHASE], syllabusDocumentId: null }],
  },
  {
    title:
      "replaceCoordinatorProgramPhases sends the syllabus the phases came from",
    call: () => replaceCoordinatorProgramPhases(PROGRAM, [PHASE], "doc-1"),
    method: "put",
    args: [`${P}/phases`, { phases: [PHASE], syllabusDocumentId: "doc-1" }],
  },
  {
    title: "launchCoordinatorProgram posts an empty body to launch",
    call: () => launchCoordinatorProgram(PROGRAM),
    method: "post",
    args: [`${P}/launch`, {}],
  },
  {
    title: "setCoordinatorProgramArchived puts the archived flag",
    call: () => setCoordinatorProgramArchived(PROGRAM, true),
    method: "put",
    args: [`${P}/archive`, { archived: true }],
  },
  {
    title: "getProgramCoordinators lists the program's coordinators",
    call: () => getProgramCoordinators(PROGRAM),
    method: "get",
    args: [`${P}/coordinators`],
  },
  {
    title: "addProgramCoordinator posts the user to add",
    call: () => addProgramCoordinator(PROGRAM, "user-1"),
    method: "post",
    args: [`${P}/coordinators`, { userId: "user-1" }],
  },
  {
    title: "inviteProgramCoordinator posts the e-mail to invite",
    call: () =>
      inviteProgramCoordinator(PROGRAM, {
        fullName: "Yeni Kişi",
        email: "yeni@x.org",
      }),
    method: "post",
    args: [
      `${P}/coordinators`,
      { invite: { fullName: "Yeni Kişi", email: "yeni@x.org" } },
    ],
  },
  {
    title: "removeProgramCoordinator deletes the encoded user",
    call: () => removeProgramCoordinator(PROGRAM, "user/1"),
    method: "delete",
    args: [`${P}/coordinators/user%2F1`],
  },
  {
    title: "getProgramEligibleEmails lists the allowed e-mails",
    call: () => getProgramEligibleEmails(PROGRAM),
    method: "get",
    args: [`${P}/eligible-emails`],
  },
  {
    title: "addProgramEligibleEmails posts every e-mail at once",
    call: () => addProgramEligibleEmails(PROGRAM, ["a@x.test", "b@x.test"]),
    method: "post",
    args: [`${P}/eligible-emails`, { emails: ["a@x.test", "b@x.test"] }],
  },
  {
    title: "removeProgramEligibleEmail deletes the encoded entry",
    call: () => removeProgramEligibleEmail(PROGRAM, "entry 1"),
    method: "delete",
    args: [`${P}/eligible-emails/entry%201`],
  },
  {
    title: "createCoordinatorProgram posts the new program",
    call: () => createCoordinatorProgram(NEW_PROGRAM),
    method: "post",
    args: ["/api/coordinator/programs", NEW_PROGRAM],
  },
  {
    title: "getProgramTeams lists the program's teams",
    call: () => getProgramTeams(PROGRAM),
    method: "get",
    args: [`${P}/teams`],
  },
  {
    title: "addProgramTeams wraps the invites in a teams field",
    call: () => addProgramTeams(PROGRAM, [TEAM_INVITE]),
    method: "post",
    args: [`${P}/teams`, { teams: [TEAM_INVITE] }],
  },
  {
    title: "updateProgramTeam puts the invite under its encoded id",
    call: () => updateProgramTeam(PROGRAM, "inv/1", TEAM_INVITE),
    method: "put",
    args: [`${P}/teams/inv%2F1`, TEAM_INVITE],
  },
  {
    title: "removeProgramTeam deletes the encoded invite",
    call: () => removeProgramTeam(PROGRAM, "inv/1"),
    method: "delete",
    args: [`${P}/teams/inv%2F1`],
  },
  {
    title: "sendProgramTeamCode posts to the invite's send-code action",
    call: () => sendProgramTeamCode(PROGRAM, "inv/1"),
    method: "post",
    args: [`${P}/teams/inv%2F1/send-code`],
  },
  {
    title: "getProgramTeamDetail reads one team by its encoded organization",
    call: () => getProgramTeamDetail(PROGRAM, "org/1"),
    method: "get",
    args: [`${P}/team-details/org%2F1`],
  },
  {
    title: "getProgramApprovals reads the approval queues",
    call: () => getProgramApprovals(PROGRAM),
    method: "get",
    args: [`${P}/approvals`],
  },
  {
    title: "decideProgramApproval posts the decision under its kind",
    call: () =>
      decideProgramApproval(PROGRAM, ApprovalKind.TeamChanges, "req/1", false),
    method: "post",
    args: [`${P}/approvals/team-changes/req%2F1`, { accepted: false }],
  },
  {
    title: "getProgramWithoutTeam lists the people with no team",
    call: () => getProgramWithoutTeam(PROGRAM),
    method: "get",
    args: [`${P}/without-team`],
  },
  {
    title: "getMentorPool lists the program's mentors",
    call: () => getMentorPool(PROGRAM),
    method: "get",
    args: [`${P}/mentors`],
  },
  {
    title: "inviteProgramMentor posts the mentor's e-mail",
    call: () => inviteProgramMentor(PROGRAM, "mentor@x.test"),
    method: "post",
    args: [`${P}/mentors`, { email: "mentor@x.test" }],
  },
  {
    title: "withdrawProgramMentorInvite deletes the encoded mentor",
    call: () => withdrawProgramMentorInvite(PROGRAM, "m/1"),
    method: "delete",
    args: [`${P}/mentors/m%2F1`],
  },
  {
    title: "getMentorReview reads the mentor's review",
    call: () => getMentorReview(PROGRAM, "m/1"),
    method: "get",
    args: [`${P}/mentors/m%2F1/review`],
  },
  {
    title: "decideProgramMentor posts the decision for the mentor",
    call: () => decideProgramMentor(PROGRAM, "m/1", true),
    method: "post",
    args: [`${P}/mentors/m%2F1/decision`, { accepted: true }],
  },
  {
    title: "renewMentorInvite posts an empty body to the invite's renew action",
    call: () => renewMentorInvite(PROGRAM, "inv/1"),
    method: "post",
    args: [`${P}/mentor-invites/inv%2F1/renew`, {}],
  },
  {
    title: "cancelMentorInvite deletes the encoded mentor invite",
    call: () => cancelMentorInvite(PROGRAM, "inv/1"),
    method: "delete",
    args: [`${P}/mentor-invites/inv%2F1`],
  },
  {
    title: "getMatching reads the matching overview",
    call: () => getMatching(PROGRAM),
    method: "get",
    args: [`${P}/matching`],
  },
  {
    title: "getMatchSuggestions reads suggestions for the encoded startup",
    call: () => getMatchSuggestions(PROGRAM, "org/1"),
    method: "get",
    args: [`${P}/matching/org%2F1/suggestions`],
  },
  {
    title: "createMatch posts the startup and mentor to pair",
    call: () =>
      createMatch(PROGRAM, { organizationId: "org-1", mentorId: "m-1" }),
    method: "post",
    args: [`${P}/matching`, { organizationId: "org-1", mentorId: "m-1" }],
  },
];

describe("coordinator programs client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
