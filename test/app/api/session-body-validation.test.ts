import { beforeEach, describe, vi } from "vitest";

import { POST as sendMessageRoute } from "@/app/api/coordinator-conversations/[id]/messages/route";
import { POST as startConversationRoute } from "@/app/api/coordinator-conversations/route";
import { POST as attachUploadRoute } from "@/app/api/document-requests/[itemId]/uploads/route";
import { PUT as replaceDocumentRequestsRoute } from "@/app/api/document-requests/route";
import { PATCH as updateMemberRoute } from "@/app/api/organization-members/[memberId]/route";
import { POST as addMemberRoute } from "@/app/api/organization-members/route";
import { POST as joinStartupRoute } from "@/app/api/organizations/join/route";
import { POST as shareDocumentRoute } from "@/app/api/startup/documents/[id]/shares/route";
import { PUT as submitAssignmentRoute } from "@/app/api/startup/process/assignments/[id]/submission/route";
import { POST as leaveTeamRoute } from "@/app/api/team-changes/leave/route";
import * as conversations from "@/lib/api/coordinator-conversations";
import * as documentRequests from "@/lib/api/document-requests";
import * as organization from "@/lib/api/organization";
import * as members from "@/lib/api/organization-members";
import * as startupDocuments from "@/lib/api/startup-documents";
import * as startupProcess from "@/lib/api/startup-process";
import * as teamChanges from "@/lib/api/team-changes";
import {
  getSessionIds,
  getSessionMentorId,
  getSessionUser,
  refreshSessionUser,
} from "@/lib/session";
import {
  answerAllWith200,
  itChecksTheBody,
  type BodyCase,
} from "@test/app/api/body-validation";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-conversations");
vi.mock("@/lib/api/document-requests");
vi.mock("@/lib/api/organization");
vi.mock("@/lib/api/organization-members");
vi.mock("@/lib/api/startup-documents");
vi.mock("@/lib/api/startup-process");
vi.mock("@/lib/api/team-changes");
vi.mock("@/lib/session");

const sessionIds = { userId: "user-1", organizationId: "org-1" };
const signedIn = appSession({ userId: "user-1", organizationId: "org-1" });
const withId = (id: string) => ({ params: Promise.resolve({ id }) });

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
    invalid: { "a document id that is not text": { documentId: 42 } },
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
    route: "POST /api/organizations/join",
    send: (request) => joinStartupRoute(request),
    valid: { inviteCode: "KAVSAK-26" },
    backend: organization.joinStartup,
    expected: ["user-1", "KAVSAK-26", null],
    invalid: { "a code of the wrong type": { inviteCode: 2026 } },
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
    organization,
    members,
    startupDocuments,
    startupProcess,
    teamChanges,
  );
}

describe.each(cases)("$route", (bodyCase) => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
  });

  itChecksTheBody(bodyCase);
});
