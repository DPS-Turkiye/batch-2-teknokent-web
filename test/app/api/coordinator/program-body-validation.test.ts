import { beforeEach, describe, vi } from "vitest";

import { POST as proposeMeetingRoute } from "@/app/api/coordinator/mentorships/[id]/meeting-proposals/route";
import { POST as addNoteRoute } from "@/app/api/coordinator/mentorships/[id]/notes/route";
import { POST as announceRoute } from "@/app/api/coordinator/programs/[id]/announcements/route";
import { POST as decideApprovalRoute } from "@/app/api/coordinator/programs/[id]/approvals/[kind]/[targetId]/route";
import { PUT as archiveRoute } from "@/app/api/coordinator/programs/[id]/archive/route";
import { POST as revokeBadgeRoute } from "@/app/api/coordinator/programs/[id]/badges/awards/[awardId]/revoke/route";
import { POST as awardBadgeRoute } from "@/app/api/coordinator/programs/[id]/badges/awards/route";
import { POST as addCoordinatorRoute } from "@/app/api/coordinator/programs/[id]/coordinators/route";
import { POST as addEligibleEmailsRoute } from "@/app/api/coordinator/programs/[id]/eligible-emails/route";
import { POST as createEventRoute } from "@/app/api/coordinator/programs/[id]/events/route";
import { POST as createMatchRoute } from "@/app/api/coordinator/programs/[id]/matching/route";
import { POST as inviteMentorRoute } from "@/app/api/coordinator/programs/[id]/mentors/route";
import { PUT as peerCategoriesRoute } from "@/app/api/coordinator/programs/[id]/peer-categories/route";
import { PUT as replacePhasesRoute } from "@/app/api/coordinator/programs/[id]/phases/route";
import { PUT as updateProgramRoute } from "@/app/api/coordinator/programs/[id]/route";
import { PUT as updateTeamRoute } from "@/app/api/coordinator/programs/[id]/teams/[inviteId]/route";
import { POST as addTeamsRoute } from "@/app/api/coordinator/programs/[id]/teams/route";
import { PUT as saveTrainingRoute } from "@/app/api/coordinator/programs/[id]/training/route";
import { POST as createProgramRoute } from "@/app/api/coordinator/programs/route";
import { POST as extractPhasesRoute } from "@/app/api/coordinator/programs/syllabus/phases/route";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { ProgramType } from "@/interfaces/program";
import { ApprovalKind } from "@/interfaces/program-approvals";
import { UserRole } from "@/interfaces/session";
import * as badges from "@/lib/api/badges";
import * as notes from "@/lib/api/coordinator-notes";
import * as programs from "@/lib/api/coordinator-programs";
import * as proposals from "@/lib/api/meeting-proposals";
import * as announcements from "@/lib/api/program-announcements";
import * as peerCategories from "@/lib/api/program-peer-categories";
import * as training from "@/lib/api/training";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerAllWith200,
  itChecksTheBody,
  type BodyCase,
} from "@test/app/api/body-validation";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/badges");
vi.mock("@/lib/api/coordinator-notes");
vi.mock("@/lib/api/coordinator-programs");
vi.mock("@/lib/api/meeting-proposals");
vi.mock("@/lib/api/program-announcements");
vi.mock("@/lib/api/program-peer-categories");
vi.mock("@/lib/api/training");
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const program = { params: Promise.resolve({ id: "program-1" }) };
const mentorship = { params: Promise.resolve({ id: "mentorship-1" }) };
const ME = "coordinator-1";

const rules = {
  name: "METU",
  description: null,
  startDate: "2026-09-01",
  endDate: null,
  meetingFrequencyDays: 14,
  staleAfterDays: 21,
  meetingNoteRequired: true,
  autoMatchSuggestions: false,
};

const question = {
  text: "Soru",
  options: ["A", "B", "C", "D"],
  correctOption: 2,
};

const cases: BodyCase[] = [
  {
    route: "POST /api/coordinator/programs",
    send: (request) => createProgramRoute(request),
    valid: {
      type: "STARTUP_MENTORING",
      name: "BİGG",
      coordinatorIds: ["c-2"],
      phases: [{ name: "Başvuru", startDate: "2026-09-01" }],
    },
    backend: programs.createCoordinatorProgram,
    expected: [
      ME,
      {
        type: ProgramType.StartupMentoring,
        name: "BİGG",
        description: null,
        startDate: null,
        endDate: null,
        coordinatorIds: ["c-2"],
        newCoordinators: [],
        phases: [
          {
            name: "Başvuru",
            startDate: "2026-09-01",
            endDate: null,
            expectedOutput: null,
          },
        ],
        syllabusDocumentId: null,
      },
    ],
    invalid: {
      "an unknown program type": {
        type: "HACKATHON",
        name: "X",
        coordinatorIds: [],
      },
      "a missing program type": { name: "X", coordinatorIds: [] },
      "the same e-mail invited twice": {
        type: "PEER_MENTORING",
        name: "X",
        coordinatorIds: [],
        newCoordinators: [
          { fullName: "Yeni", email: "yeni@x.org" },
          { fullName: "Yeni Kişi", email: "Yeni@X.org" },
        ],
      },
      "an invited coordinator without a name": {
        type: "PEER_MENTORING",
        name: "X",
        coordinatorIds: [],
        newCoordinators: [{ email: "yeni@teknokent.org" }],
      },
      "a rule sent as text": {
        type: "PEER_MENTORING",
        name: "X",
        coordinatorIds: [],
        defaultMentorCapacity: "3",
      },
      "a phase without a name": {
        type: "PEER_MENTORING",
        name: "X",
        coordinatorIds: [],
        phases: [{ startDate: null }],
      },
    },
  },
  {
    route: "PUT /api/coordinator/programs/[id]",
    method: "PUT",
    send: (request) => updateProgramRoute(request, program),
    valid: { ...rules, defaultMentorCapacity: null, rosterOnly: true },
    backend: programs.updateCoordinatorProgram,
    expected: [ME, "program-1", { ...rules, rosterOnly: true }],
    invalid: {
      "a missing meeting frequency": { ...rules, meetingFrequencyDays: null },
      "a meeting frequency sent as text": {
        ...rules,
        meetingFrequencyDays: "14",
      },
      "a flag sent as text": { ...rules, meetingNoteRequired: "true" },
      "an optional flag of the wrong type": { ...rules, individualMentees: 1 },
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/events",
    send: (request) => createEventRoute(request, program),
    valid: { title: "Demo Day", kind: "DEADLINE", startsAt: "2026-12-01" },
    backend: programs.createCoordinatorProgramEvent,
    expected: [
      ME,
      "program-1",
      {
        title: "Demo Day",
        kind: ProgramEventKind.Deadline,
        startsAt: "2026-12-01",
        endsAt: null,
        description: null,
      },
    ],
    invalid: {
      "an unknown kind": { title: "X", kind: "MEETUP", startsAt: "2026-12-01" },
      "a missing kind": { title: "X", startsAt: "2026-12-01" },
      "a title of the wrong type": {
        title: 7,
        kind: "EVENT",
        startsAt: "2026-12-01",
      },
    },
  },
  {
    route: "PUT /api/coordinator/programs/[id]/phases",
    method: "PUT",
    send: (request) => replacePhasesRoute(request, program),
    valid: {
      phases: [
        {
          name: "Doğrulama",
          startDate: null,
          endDate: null,
          expectedOutput: "Rapor",
        },
      ],
    },
    backend: programs.replaceCoordinatorProgramPhases,
    expected: [
      ME,
      "program-1",
      [
        {
          name: "Doğrulama",
          startDate: null,
          endDate: null,
          expectedOutput: "Rapor",
        },
      ],
      null,
    ],
    invalid: {
      "no phases (which would wipe them all)": {},
      "a phase date of the wrong type": {
        phases: [{ name: "X", startDate: 20260901 }],
      },
      "a syllabus id of the wrong type": { phases: [], syllabusDocumentId: 3 },
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/teams",
    send: (request) => addTeamsRoute(request, program),
    valid: { teams: [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }] },
    backend: programs.addProgramTeams,
    expected: [
      ME,
      "program-1",
      [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }],
    ],
    invalid: {
      "no teams": {},
      "a team that is not an object": { teams: ["Kavşak"] },
      "a team without a lead email": { teams: [{ teamName: "Kavşak" }] },
    },
  },
  {
    route: "PUT /api/coordinator/programs/[id]/teams/[inviteId]",
    method: "PUT",
    send: (request) =>
      updateTeamRoute(request, {
        params: Promise.resolve({ id: "program-1", inviteId: "invite-1" }),
      }),
    valid: { teamName: "Tohum", leadEmail: "can@tohum.io" },
    backend: programs.updateProgramTeam,
    expected: [
      ME,
      "program-1",
      "invite-1",
      { teamName: "Tohum", leadEmail: "can@tohum.io" },
    ],
    invalid: { "a missing lead email": { teamName: "Tohum" } },
  },
  {
    route: "POST /api/coordinator/programs/syllabus/phases",
    send: (request) => extractPhasesRoute(request),
    valid: { documentId: "doc-1", startDate: "", endDate: "2026-12-01" },
    backend: programs.extractSyllabusPhases,
    expected: [
      ME,
      { documentId: "doc-1", startDate: null, endDate: "2026-12-01" },
    ],
    invalid: {
      "a missing document": { startDate: null },
      "a date of the wrong type": { documentId: "doc-1", startDate: 5 },
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/approvals/[kind]/[targetId]",
    send: (request) =>
      decideApprovalRoute(request, {
        params: Promise.resolve({
          id: "program-1",
          kind: ApprovalKind.Mentors,
          targetId: "target-1",
        }),
      }),
    valid: { accepted: false },
    backend: programs.decideProgramApproval,
    expected: [ME, "program-1", ApprovalKind.Mentors, "target-1", false],
    invalid: {
      "a decision sent as text": { accepted: "yes" },
      "no decision": {},
    },
  },
  {
    route: "PUT /api/coordinator/programs/[id]/archive",
    method: "PUT",
    send: (request) => archiveRoute(request, program),
    valid: { archived: true },
    backend: programs.setCoordinatorProgramArchived,
    expected: [ME, "program-1", true],
    invalid: { "a flag sent as text": { archived: "true" } },
  },
  {
    route: "POST /api/coordinator/programs/[id]/coordinators",
    send: (request) => addCoordinatorRoute(request, program),
    valid: { userId: "c-2" },
    backend: programs.addProgramCoordinator,
    expected: [ME, "program-1", { userId: "c-2" }],
    invalid: {
      "a user id of the wrong type": { userId: 2 },
      "neither a user nor an invite": {},
      "both a user and an invite": {
        userId: "c-2",
        invite: { fullName: "Yeni", email: "yeni@x.org" },
      },
      "an invite whose e-mail is not one": {
        invite: { fullName: "Yeni", email: "yeni" },
      },
      "an invite with a blank name": {
        invite: { fullName: " ", email: "yeni@x.org" },
      },
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/eligible-emails",
    send: (request) => addEligibleEmailsRoute(request, program),
    valid: { emails: ["ayse@metu.edu.tr"] },
    backend: programs.addProgramEligibleEmails,
    expected: [ME, "program-1", ["ayse@metu.edu.tr"]],
    invalid: {
      "an address that is not a string": { emails: ["a@b.co", 7] },
      "no addresses": {},
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/matching",
    send: (request) => createMatchRoute(request, program),
    valid: { organizationId: "terra", mentorId: "nihan" },
    backend: programs.createMatch,
    expected: [ME, "program-1", { organizationId: "terra", mentorId: "nihan" }],
    invalid: { "a missing mentor": { organizationId: "terra" } },
  },
  {
    route: "POST /api/coordinator/programs/[id]/mentors",
    send: (request) => inviteMentorRoute(request, program),
    valid: { email: "nihan@menton.test" },
    backend: programs.inviteProgramMentor,
    expected: [ME, "program-1", "nihan@menton.test"],
    invalid: { "a missing address": {} },
  },
  {
    route: "POST /api/coordinator/programs/[id]/announcements",
    send: (request) => announceRoute(request, program),
    valid: { body: "Demo Day ertelendi." },
    backend: announcements.postProgramAnnouncement,
    expected: [ME, "program-1", "Demo Day ertelendi."],
    invalid: { "a text of the wrong type": { body: ["Demo"] } },
  },
  {
    route: "POST /api/coordinator/mentorships/[id]/notes",
    send: (request) => addNoteRoute(request, mentorship),
    valid: { body: "Takım iyi gidiyor." },
    backend: notes.addCoordinatorNote,
    expected: [ME, "mentorship-1", "Takım iyi gidiyor."],
    invalid: { "a missing text": {} },
  },
  {
    route: "POST /api/coordinator/mentorships/[id]/meeting-proposals",
    send: (request) => proposeMeetingRoute(request, mentorship),
    valid: {
      scheduledAt: "2026-11-20T10:00:00Z",
      durationMinutes: 45,
      agenda: null,
    },
    backend: proposals.proposeMeeting,
    expected: [
      ME,
      "mentorship-1",
      {
        scheduledAt: "2026-11-20T10:00:00Z",
        durationMinutes: 45,
        agenda: null,
        replacesMeetingId: null,
      },
    ],
    invalid: {
      "a missing duration (once read as 0 minutes)": {
        scheduledAt: "2026-11-20T10:00:00Z",
      },
      "a duration sent as text": {
        scheduledAt: "2026-11-20T10:00:00Z",
        durationMinutes: "45",
      },
    },
  },
  {
    route: "POST /api/coordinator/programs/[id]/badges/awards",
    send: (request) => awardBadgeRoute(request, program),
    valid: { userId: "student-1" },
    backend: badges.awardGateBadge,
    expected: [ME, "program-1", "student-1"],
    invalid: { "an empty user id": { userId: "" } },
  },
  {
    route: "POST /api/coordinator/programs/[id]/badges/awards/[awardId]/revoke",
    send: (request) =>
      revokeBadgeRoute(request, {
        params: Promise.resolve({ id: "program-1", awardId: "award-1" }),
      }),
    valid: { reason: "  Kural ihlali " },
    backend: badges.revokeGateBadge,
    expected: [ME, "program-1", "award-1", "Kural ihlali"],
    invalid: { "a blank reason": { reason: "   " } },
  },
  {
    route: "PUT /api/coordinator/programs/[id]/peer-categories",
    method: "PUT",
    send: (request) => peerCategoriesRoute(request, program),
    valid: { categories: [PeerTopicCategory.International] },
    backend: peerCategories.replaceProgramPeerCategories,
    expected: [ME, "program-1", [PeerTopicCategory.International]],
    invalid: {
      "an unknown category": { categories: ["NOT_A_CATEGORY"] },
      "no categories (which would turn them all off)": {},
    },
  },
  {
    route: "PUT /api/coordinator/programs/[id]/training",
    method: "PUT",
    send: (request) => saveTrainingRoute(request, program),
    valid: { videoUrl: "https://youtu.be/abc", questions: [question] },
    backend: training.saveTraining,
    expected: [
      ME,
      "program-1",
      { videoUrl: "https://youtu.be/abc", questions: [question] },
    ],
    invalid: {
      "a question with three options": {
        videoUrl: "https://youtu.be/abc",
        questions: [{ ...question, options: ["A", "B", "C"] }],
      },
      "no questions": { videoUrl: "https://youtu.be/abc" },
    },
  },
];

describe.each(cases)("$route", (bodyCase) => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: ME, role: UserRole.Coordinator }),
    });
    answerAllWith200(
      badges,
      notes,
      programs,
      proposals,
      announcements,
      peerCategories,
      training,
    );
  });

  itChecksTheBody(bodyCase);
});
