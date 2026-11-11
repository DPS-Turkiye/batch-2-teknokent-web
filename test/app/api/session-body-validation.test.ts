import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as sendMessageRoute } from "@/app/api/coordinator-conversations/[id]/messages/route";
import { POST as startConversationRoute } from "@/app/api/coordinator-conversations/route";
import { POST as attachUploadRoute } from "@/app/api/document-requests/[itemId]/uploads/route";
import { PUT as replaceDocumentRequestsRoute } from "@/app/api/document-requests/route";
import { POST as declineProposalRoute } from "@/app/api/meeting-proposals/[id]/decline/route";
import { POST as feedbackRoute } from "@/app/api/meetings/[id]/feedback/route";
import { POST as rescheduleRoute } from "@/app/api/meetings/[id]/reschedule-proposals/route";
import { POST as createMentorRequestRoute } from "@/app/api/mentor-requests/route";
import { PATCH as goalDoneRoute } from "@/app/api/mentorships/[id]/goals/[goalId]/route";
import { POST as addGoalRoute } from "@/app/api/mentorships/[id]/goals/route";
import { PATCH as updateMentorshipRoute } from "@/app/api/mentorships/[id]/route";
import { PUT as weekCheckRoute } from "@/app/api/mentorships/[id]/week-checks/route";
import { POST as startMentorshipRoute } from "@/app/api/mentorships/route";
import { PATCH as updateMemberRoute } from "@/app/api/organization-members/[memberId]/route";
import { POST as addMemberRoute } from "@/app/api/organization-members/route";
import { POST as joinStartupRoute } from "@/app/api/organizations/join/route";
import { PUT as peerProfileRoute } from "@/app/api/peer-mentoring/profile/route";
import { POST as peerRequestRoute } from "@/app/api/peer-mentoring/requests/route";
import { POST as shareDocumentRoute } from "@/app/api/startup/documents/[id]/shares/route";
import { PUT as submitAssignmentRoute } from "@/app/api/startup/process/assignments/[id]/submission/route";
import { POST as leaveTeamRoute } from "@/app/api/team-changes/leave/route";
import { POST as trainingAttemptRoute } from "@/app/api/training/peer/attempts/route";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import * as conversations from "@/lib/api/coordinator-conversations";
import * as documentRequests from "@/lib/api/document-requests";
import * as proposals from "@/lib/api/meeting-proposals";
import * as meetings from "@/lib/api/meetings";
import * as mentorRequests from "@/lib/api/mentor-requests";
import * as mentorships from "@/lib/api/mentorships";
import * as organization from "@/lib/api/organization";
import * as members from "@/lib/api/organization-members";
import * as peerMentoring from "@/lib/api/peer-mentoring";
import * as startupDocuments from "@/lib/api/startup-documents";
import * as startupProcess from "@/lib/api/startup-process";
import * as teamChanges from "@/lib/api/team-changes";
import * as training from "@/lib/api/training";
import {
  getSessionIds,
  getSessionMentorId,
  getSessionUser,
  refreshSessionUser,
} from "@/lib/session";
import {
  answerAllWith200,
  itChecksTheBody,
  jsonRequest,
  type BodyCase,
} from "@test/app/api/body-validation";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-conversations");
vi.mock("@/lib/api/document-requests");
vi.mock("@/lib/api/meeting-proposals");
vi.mock("@/lib/api/meetings");
vi.mock("@/lib/api/mentor-requests");
vi.mock("@/lib/api/mentorships");
vi.mock("@/lib/api/organization");
vi.mock("@/lib/api/organization-members");
vi.mock("@/lib/api/peer-mentoring");
vi.mock("@/lib/api/startup-documents");
vi.mock("@/lib/api/startup-process");
vi.mock("@/lib/api/team-changes");
vi.mock("@/lib/api/training");
vi.mock("@/lib/session");

const sessionIds = { userId: "user-1", organizationId: "org-1" };
const signedIn = appSession({ userId: "user-1", organizationId: "org-1" });
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const mentorship = withId("mentorship-1");

const peerProfile = {
  categories: [PeerTopicCategory.International],
  subTopics: ["Erasmus"],
  strongCourses: ["MATH119"],
  projects: [],
  erasmus: "Lizbon",
  helpWith: "Başvuru",
  linkedinUrl: "",
};

const cases: BodyCase[] = [
  {
    route: "POST /api/coordinator-conversations",
    send: (request) => startConversationRoute(request),
    valid: { programId: "program-1", mentorId: "mentor-1" },
    backend: conversations.startCoordinatorConversation,
    expected: [
      "user-1",
      { programId: "program-1", organizationId: null, mentorId: "mentor-1" },
    ],
    invalid: {
      "a missing program": { mentorId: "mentor-1" },
      "a startup id of the wrong type": { programId: "p", organizationId: 5 },
    },
  },
  {
    route: "POST /api/coordinator-conversations/[id]/messages",
    send: (request) => sendMessageRoute(request, withId("conversation-1")),
    valid: { body: "Merhaba" },
    backend: conversations.sendCoordinatorMessage,
    expected: ["user-1", "conversation-1", "Merhaba"],
    invalid: { "a missing text": {} },
  },
  {
    route: "POST /api/meeting-proposals/[id]/decline",
    send: (request) => declineProposalRoute(request, withId("proposal-1")),
    valid: { reason: "O gün doluyum." },
    backend: proposals.declineMeetingProposal,
    expected: ["user-1", "proposal-1", "O gün doluyum."],
    invalid: { "a reason of the wrong type": { reason: 5 } },
  },
  {
    route: "POST /api/meetings/[id]/reschedule-proposals",
    send: (request) => rescheduleRoute(request, withId("meeting-1")),
    valid: { scheduledAt: "2026-11-20T10:00:00Z", durationMinutes: 30 },
    backend: proposals.proposeReschedule,
    expected: [
      "user-1",
      "meeting-1",
      { scheduledAt: "2026-11-20T10:00:00Z", durationMinutes: 30 },
    ],
    invalid: {
      "a missing duration (once read as 0 minutes)": {
        scheduledAt: "2026-11-20T10:00:00Z",
      },
    },
  },
  {
    route: "POST /api/mentorships",
    send: (request) => startMentorshipRoute(request),
    valid: {
      organizationId: "org-1",
      startDate: "2026-11-01",
      endDate: "2027-01-31",
      daysPerWeek: 9,
    },
    backend: mentorships.createRegularMentorship,
    expected: [
      {
        mentorId: "mentor-1",
        organizationId: "org-1",
        status: "ACTIVE",
        startDate: "2026-11-01",
        endDate: "2027-01-31",
        daysPerWeek: 7,
      },
    ],
    invalid: {
      "a missing end date": {
        organizationId: "org-1",
        startDate: "2026-11-01",
        daysPerWeek: 1,
      },
      "days per week sent as text": {
        organizationId: "org-1",
        startDate: "2026-11-01",
        endDate: "2027-01-31",
        daysPerWeek: "2",
      },
    },
  },
  {
    route: "PATCH /api/mentorships/[id]",
    method: "PATCH",
    send: (request) => updateMentorshipRoute(request, mentorship),
    valid: { startDate: "2026-11-01", endDate: null, daysPerWeek: 2 },
    backend: mentorships.updateRegularMentorship,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        startDate: "2026-11-01",
        endDate: null,
        daysPerWeek: 2,
      },
    ],
    invalid: { "missing days per week": { startDate: "2026-11-01" } },
  },
  {
    route: "PUT /api/mentorships/[id]/week-checks",
    method: "PUT",
    send: (request) => weekCheckRoute(request, mentorship),
    valid: { weekStart: "2026-11-09", completed: true },
    backend: mentorships.upsertMentorshipWeekCheck,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        weekStart: "2026-11-09",
        completed: true,
      },
    ],
    invalid: {
      "a flag sent as text": { weekStart: "2026-11-09", completed: "yes" },
      "an empty week": { weekStart: "", completed: true },
    },
  },
  {
    route: "POST /api/mentorships/[id]/goals",
    send: (request) => addGoalRoute(request, mentorship),
    valid: { title: "  MVP'yi bitir " },
    backend: mentorships.createMentorshipGoal,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        title: "MVP'yi bitir",
      },
    ],
    invalid: { "a blank title": { title: "   " } },
  },
  {
    route: "PATCH /api/mentorships/[id]/goals/[goalId]",
    method: "PATCH",
    send: (request) =>
      goalDoneRoute(request, {
        params: Promise.resolve({ id: "mentorship-1", goalId: "goal-1" }),
      }),
    valid: { done: true },
    backend: mentorships.updateMentorshipGoal,
    expected: [
      {
        mentorshipId: "mentorship-1",
        goalId: "goal-1",
        actorId: "mentor-1",
        done: true,
      },
    ],
    invalid: {
      "no flag (once read as not done)": {},
      "a flag sent as text": { done: "true" },
    },
  },
  {
    route: "POST /api/team-changes/leave",
    send: (request) => leaveTeamRoute(request),
    valid: { successorId: "user-2" },
    backend: teamChanges.leaveTeam,
    expected: ["org-1", "user-1", "user-2"],
    invalid: { "a successor of the wrong type": { successorId: 2 } },
  },
  {
    route: "POST /api/organization-members",
    send: (request) => addMemberRoute(request),
    valid: { fullName: "Deniz", email: "deniz@kavsak.co" },
    backend: members.createOrganizationMember,
    expected: [
      "org-1",
      "user-1",
      { fullName: "Deniz", email: "deniz@kavsak.co" },
    ],
    invalid: {
      "a missing address": { fullName: "Deniz" },
      "a job title of the wrong type": {
        fullName: "Deniz",
        email: "deniz@kavsak.co",
        jobTitle: null,
      },
    },
  },
  {
    route: "PATCH /api/organization-members/[memberId]",
    method: "PATCH",
    send: (request) =>
      updateMemberRoute(request, {
        params: Promise.resolve({ memberId: "member-1" }),
      }),
    valid: { fullName: "Deniz", jobTitle: "CTO" },
    backend: members.updateOrganizationMember,
    expected: [
      "org-1",
      "member-1",
      "user-1",
      { fullName: "Deniz", jobTitle: "CTO" },
    ],
    invalid: { "a name of the wrong type": { fullName: 5 } },
  },
  {
    route: "POST /api/startup/documents/[id]/shares",
    send: (request) => shareDocumentRoute(request, withId("doc-1")),
    valid: { mentorId: "mentor-1" },
    backend: startupDocuments.shareStartupDocument,
    expected: ["doc-1", "user-1", "mentor-1"],
    invalid: { "a missing mentor": {} },
  },
  {
    route: "PUT /api/startup/process/assignments/[id]/submission",
    method: "PUT",
    send: (request) => submitAssignmentRoute(request, withId("assignment-1")),
    valid: { documentId: "doc-1" },
    backend: startupProcess.submitProcessAssignment,
    expected: ["org-1", "assignment-1", "user-1", "doc-1"],
    invalid: { "a missing document": {} },
  },
  {
    route: "PUT /api/document-requests",
    method: "PUT",
    url: "http://localhost/api/document-requests?meetingId=meeting-1",
    send: (request) => replaceDocumentRequestsRoute(request),
    valid: { titles: ["Pitch deck"] },
    backend: documentRequests.replaceDocumentRequests,
    expected: [
      { meetingId: "meeting-1" },
      { actorId: "mentor-1", titles: ["Pitch deck"] },
    ],
    invalid: {
      "a title that is not a string": { titles: ["Pitch deck", 1] },
      "no titles (which would clear the list)": {},
    },
  },
  {
    route: "POST /api/document-requests/[itemId]/uploads",
    send: (request) =>
      attachUploadRoute(request, {
        params: Promise.resolve({ itemId: "item-1" }),
      }),
    valid: { storedDocumentId: "stored-1" },
    backend: documentRequests.attachDocumentRequestUpload,
    expected: ["item-1", { actorId: "user-1", storedDocumentId: "stored-1" }],
    invalid: { "a document id of the wrong type": { storedDocumentId: 5 } },
  },
  {
    route: "PUT /api/peer-mentoring/profile",
    method: "PUT",
    send: (request) => peerProfileRoute(request),
    valid: peerProfile,
    backend: peerMentoring.savePeerMentorProfile,
    expected: ["user-1", peerProfile],
    invalid: {
      "an unknown category": { ...peerProfile, categories: ["NOT_A_CATEGORY"] },
      "a missing field (once saved as empty)": {
        ...peerProfile,
        erasmus: undefined,
      },
    },
  },
  {
    route: "POST /api/peer-mentoring/requests",
    send: (request) => peerRequestRoute(request),
    valid: {
      mentorId: "mentor-1",
      category: PeerTopicCategory.International,
      message: "Erasmus başvurusu",
    },
    backend: peerMentoring.createPeerMentoringRequest,
    expected: [
      "user-1",
      {
        mentorId: "mentor-1",
        category: PeerTopicCategory.International,
        message: "Erasmus başvurusu",
      },
    ],
    invalid: {
      "an unknown category": {
        mentorId: "mentor-1",
        category: "NOT_A_CATEGORY",
        message: "",
      },
      "a missing category": { mentorId: "mentor-1", message: "" },
    },
  },
  {
    route: "POST /api/training/peer/attempts",
    send: (request) => trainingAttemptRoute(request),
    valid: { version: 3, answers: { "question-1": 2 } },
    backend: training.submitTrainingAttempt,
    expected: ["user-1", 3, { "question-1": 2 }],
    invalid: {
      "a version sent as text": { version: "3", answers: {} },
      "an answer that is not a whole number": {
        version: 3,
        answers: { "question-1": 1.5 },
      },
    },
  },
  {
    route: "POST /api/organizations/join",
    send: (request) => joinStartupRoute(request),
    valid: { inviteCode: "KAVSAK-26" },
    backend: organization.joinStartup,
    expected: ["user-1", "KAVSAK-26"],
    invalid: { "a code of the wrong type": { inviteCode: 2026 } },
  },
  {
    route: "POST /api/meetings/[id]/feedback (handed on as it came)",
    send: (request) => feedbackRoute(request, withId("meeting-1")),
    valid: { rating: 5, comment: "Faydalı" },
    backend: meetings.submitMeetingFeedback,
    expected: ["meeting-1", "user-1", { rating: 5, comment: "Faydalı" }],
    invalid: { "an array": [5], null: null },
  },
  {
    route: "POST /api/mentor-requests (handed on as it came)",
    send: (request) => createMentorRequestRoute(request),
    valid: { mentorId: "mentor-1", topics: ["finance"] },
    backend: mentorRequests.createMentorRequest,
    expected: [sessionIds, { mentorId: "mentor-1", topics: ["finance"] }],
    invalid: { "a string": '"hello"' },
  },
];

function signIn() {
  vi.mocked(getSessionIds).mockResolvedValue(sessionIds);
  vi.mocked(getSessionUser).mockResolvedValue(signedIn);
  vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");
  vi.mocked(refreshSessionUser).mockResolvedValue(signedIn);
  answerAllWith200(
    conversations,
    documentRequests,
    proposals,
    meetings,
    mentorRequests,
    mentorships,
    organization,
    members,
    peerMentoring,
    startupDocuments,
    startupProcess,
    teamChanges,
    training,
  );
}

describe.each(cases)("$route", (bodyCase) => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
  });

  itChecksTheBody(bodyCase);
});

describe("declining a meeting proposal without a body", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
  });

  it("still declines, with no reason", async () => {
    const response = await declineProposalRoute(
      jsonRequest(undefined),
      withId("proposal-1"),
    );

    expect(response.status).toBe(200);
    expect(proposals.declineMeetingProposal).toHaveBeenCalledWith(
      "user-1",
      "proposal-1",
      null,
    );
  });
});
