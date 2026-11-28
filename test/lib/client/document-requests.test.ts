import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  attachDocumentRequestUpload,
  deleteDocumentRequestUpload,
  listDocumentRequests,
  replaceDocumentRequests,
} from "@/lib/client/document-requests";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const scope = {
  mentorshipRequestId: undefined,
  meetingId: "meeting-1",
  mentorshipId: undefined,
};

const calls: ClientCall[] = [
  {
    title: "listDocumentRequests reads one meeting's checklist",
    call: () => listDocumentRequests({ meetingId: "meeting-1" }),
    method: "get",
    args: ["/api/document-requests", { params: scope }],
  },
  {
    title: "replaceDocumentRequests sends the titles, naming nobody",
    call: () => replaceDocumentRequests({ meetingId: "meeting-1" }, ["CV"]),
    method: "put",
    args: ["/api/document-requests", { titles: ["CV"] }, { params: scope }],
  },
  {
    title: "attachDocumentRequestUpload attaches the stored file",
    call: () => attachDocumentRequestUpload("item/1", "doc-1"),
    method: "post",
    args: [
      "/api/document-requests/item%2F1/uploads",
      { storedDocumentId: "doc-1" },
    ],
  },
  {
    title: "deleteDocumentRequestUpload removes the upload",
    call: () => deleteDocumentRequestUpload("up/1"),
    method: "delete",
    args: ["/api/document-requests/uploads/up%2F1"],
    returnsNothing: true,
  },
];

describe("document request client, straight to the backend", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});
