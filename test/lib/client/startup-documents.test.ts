import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getOrganizationDocuments,
  getStartupDocumentRequests,
  getStartupDocuments,
  shareDocument,
  unshareDocument,
} from "@/lib/client/startup-documents";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { OWN_ORGANIZATION_PATH as OWN } from "@test/mocks/own-organization";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

const calls: ClientCall[] = [
  {
    title: "getStartupDocuments lists the caller's own startup's files",
    call: () => getStartupDocuments(),
    method: "get",
    args: [`${OWN}/documents`],
  },
  {
    title: "getOrganizationDocuments lists another startup's files",
    call: () => getOrganizationDocuments("org/2"),
    method: "get",
    args: ["/api/organizations/org%2F2/documents"],
  },
  {
    title: "getStartupDocumentRequests lists what was asked of the own startup",
    call: () => getStartupDocumentRequests(),
    method: "get",
    args: [`${OWN}/document-requests`],
  },
  {
    title: "getDocumentDownloadUrl asks for a short-lived link to the file",
    call: () => getDocumentDownloadUrl("doc 1"),
    method: "get",
    args: ["/api/documents/doc%201/download-url"],
  },
  {
    title: "shareDocument names the mentor",
    call: () => shareDocument("doc 1", "mentor-1"),
    method: "post",
    args: ["/api/documents/doc%201/shares", { mentorId: "mentor-1" }],
  },
  {
    title: "unshareDocument deletes the mentor's share",
    call: () => unshareDocument("doc-1", "mentor/1"),
    method: "delete",
    args: ["/api/documents/doc-1/shares/mentor%2F1"],
  },
  {
    title: "deleteDocument deletes the file",
    call: () => deleteDocument("doc-1"),
    method: "delete",
    args: ["/api/documents/doc-1"],
    returnsNothing: true,
  },
];

describe("startup document client, straight to the backend", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});
