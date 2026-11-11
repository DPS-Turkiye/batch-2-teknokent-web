import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteStartupDocument,
  fetchDocumentDownloadUrl,
  fetchStartupDocumentRequests,
  fetchStartupDocuments,
  shareStartupDocument,
  unshareStartupDocument,
} from "@/lib/api/startup-documents";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists an encoded startup's documents",
    () => fetchStartupDocuments("org/1", "member-1"),
    {
      method: "GET",
      url: "/api/organizations/org%2F1/documents",
      params: { actorId: "member-1" },
    },
  ],
  [
    "lists an encoded startup's document requests",
    () => fetchStartupDocumentRequests("org/1", "member-1"),
    {
      method: "GET",
      url: "/api/organizations/org%2F1/document-requests",
      params: { actorId: "member-1" },
    },
  ],
  [
    "asks for an encoded document's download link",
    () => fetchDocumentDownloadUrl("doc/1", "member-1"),
    {
      method: "GET",
      url: "/api/documents/doc%2F1/download-url",
      params: { actorId: "member-1" },
    },
  ],
  [
    "shares a document with a mentor",
    () => shareStartupDocument("doc/1", "member-1", "mentor-1"),
    {
      method: "POST",
      url: "/api/documents/doc%2F1/shares",
      data: { actorId: "member-1", mentorId: "mentor-1" },
    },
  ],
  [
    "stops sharing a document with an encoded mentor",
    () => unshareStartupDocument("doc/1", "mentor 1", "member-1"),
    {
      method: "DELETE",
      url: "/api/documents/doc%2F1/shares/mentor%201",
      params: { actorId: "member-1" },
    },
  ],
  [
    "deletes an encoded document",
    () => deleteStartupDocument("doc/1", "member-1"),
    {
      method: "DELETE",
      url: "/api/documents/doc%2F1",
      params: { actorId: "member-1" },
    },
  ],
];

describe("startup documents server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
