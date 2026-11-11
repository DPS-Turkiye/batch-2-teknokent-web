import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchPlatformFeedbackInbox,
  markPlatformFeedbackRead,
  postPlatformFeedback,
} from "@/lib/api/platform-feedback";
import {
  getPlatformFeedbackInbox,
  readPlatformFeedback,
  submitPlatformFeedback,
} from "@/lib/client/platform-feedback";
import { httpClient } from "@/lib/http-client";
import { HttpMethod } from "@/lib/http-method";
import {
  feedbackInboxQuerySchema,
  platformFeedbackSubmissionSchema,
} from "@/lib/platform-feedback";
import { backendRequest } from "@/lib/server/backend-client";
import { createAxiosResponse } from "@test/fixtures/health";
import { platformFeedback } from "@test/fixtures/platform-feedback";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));
vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  const response = createAxiosResponse(platformFeedback(), 200);
  vi.mocked(httpClient.get).mockResolvedValue(response);
  vi.mocked(httpClient.post).mockResolvedValue(response);
  vi.mocked(httpClient.patch).mockResolvedValue(response);
});

describe("platform feedback contracts", () => {
  it("passes the resolved actor through the server wrappers", async () => {
    await postPlatformFeedback("author", platformFeedback());
    expect(backendRequest).toHaveBeenLastCalledWith({
      method: HttpMethod.Post,
      url: "/api/platform-feedback",
      data: { ...platformFeedback(), actorId: "author" },
    });
    await fetchPlatformFeedbackInbox("admin", 2, true);
    expect(backendRequest).toHaveBeenLastCalledWith({
      method: HttpMethod.Get,
      url: "/api/admin/platform-feedback",
      params: { actorId: "admin", page: 2, unreadOnly: true },
    });
    await markPlatformFeedbackRead("admin", "id/with/slash");
    expect(backendRequest).toHaveBeenLastCalledWith({
      method: HttpMethod.Patch,
      url: "/api/admin/platform-feedback/id%2Fwith%2Fslash/read",
      params: { actorId: "admin" },
    });
  });

  it("uses same-origin routes and rejects failed responses", async () => {
    await submitPlatformFeedback(platformFeedback());
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/platform-feedback",
      platformFeedback(),
    );
    await getPlatformFeedbackInbox(1, true);
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/admin/platform-feedback",
      { params: { page: 1, unreadOnly: true } },
    );
    await readPlatformFeedback("id/with/slash");
    expect(httpClient.patch).toHaveBeenCalledWith(
      "/api/admin/platform-feedback/id%2Fwith%2Fslash/read",
    );
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 403,
      data: {},
      headers: {},
    });
    await expect(
      submitPlatformFeedback(platformFeedback()),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("normalizes text, strips extra fields and applies shared limits", () => {
    expect(
      platformFeedbackSubmissionSchema.parse({
        ...platformFeedback(),
        subject: "  Subject  ",
        actorId: "spoofed",
      }),
    ).toEqual({
      kind: "SUGGESTION",
      subject: "Subject",
      message: platformFeedback().message,
      language: "en",
    });
    expect(
      platformFeedbackSubmissionSchema.safeParse({
        ...platformFeedback(),
        message: " ",
      }).success,
    ).toBe(false);
    expect(
      platformFeedbackSubmissionSchema.safeParse({
        ...platformFeedback(),
        subject: "x".repeat(120),
        message: "x".repeat(2000),
      }).success,
    ).toBe(true);
    expect(feedbackInboxQuerySchema.parse({})).toEqual({
      page: 0,
      unreadOnly: false,
    });
  });
});
