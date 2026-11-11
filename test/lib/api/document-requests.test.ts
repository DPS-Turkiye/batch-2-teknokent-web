import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  attachDocumentRequestUpload,
  deleteDocumentRequestUpload,
  fetchDocumentRequests,
  replaceDocumentRequests,
} from "@/lib/api/document-requests";
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
    "lists a meeting's document requests",
    () => fetchDocumentRequests({ meetingId: "meet-1" }),
    {
      method: "GET",
      url: "/api/document-requests",
      params: { meetingId: "meet-1" },
    },
  ],
  [
    "replaces a mentorship's requested titles",
    () =>
      replaceDocumentRequests(
        { mentorshipId: "ms-1" },
        { actorId: "mentor-1", titles: ["Pitch deck", "Bütçe"] },
      ),
    {
      method: "PUT",
      url: "/api/document-requests",
      params: { mentorshipId: "ms-1" },
      data: { actorId: "mentor-1", titles: ["Pitch deck", "Bütçe"] },
    },
  ],
  [
    "attaches an upload to an encoded request item",
    () =>
      attachDocumentRequestUpload("item/1", {
        actorId: "member-1",
        storedDocumentId: "doc-1",
      }),
    {
      method: "POST",
      url: "/api/document-requests/item%2F1/uploads",
      data: { actorId: "member-1", storedDocumentId: "doc-1" },
    },
  ],
  [
    "deletes an encoded upload",
    () => deleteDocumentRequestUpload("up/1", "member-1"),
    {
      method: "DELETE",
      url: "/api/document-requests/uploads/up%2F1",
      params: { actorId: "member-1" },
    },
  ],
];

describe("document requests server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
