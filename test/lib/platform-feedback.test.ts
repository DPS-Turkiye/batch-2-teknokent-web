import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramType } from "@/interfaces/program";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getPlatformFeedbackInbox,
  readPlatformFeedback,
  submitPlatformFeedback,
} from "@/lib/client/platform-feedback";
import { platformFeedbackSubmissionSchema } from "@/lib/platform-feedback";
import { createAxiosResponse } from "@test/fixtures/health";
import { platformFeedback } from "@test/fixtures/platform-feedback";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

beforeEach(() => {
  vi.clearAllMocks();
  const response = createAxiosResponse(platformFeedback(), 200);
  vi.mocked(backendHttp.get).mockResolvedValue(response);
  vi.mocked(backendHttp.post).mockResolvedValue(response);
  vi.mocked(backendHttp.patch).mockResolvedValue(response);
});

describe("platform feedback contracts", () => {
  it("calls the backend directly, naming nobody, and rejects failed responses", async () => {
    await submitPlatformFeedback(platformFeedback());
    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/platform-feedback",
      platformFeedback(),
    );
    await getPlatformFeedbackInbox(1, true);
    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/admin/platform-feedback",
      { params: { page: 1, unreadOnly: true } },
    );
    await getPlatformFeedbackInbox(0, false, ProgramType.PeerMentoring);
    expect(backendHttp.get).toHaveBeenLastCalledWith(
      "/api/admin/platform-feedback",
      {
        params: {
          page: 0,
          unreadOnly: false,
          programType: ProgramType.PeerMentoring,
        },
      },
    );
    await readPlatformFeedback("id/with/slash");
    expect(backendHttp.patch).toHaveBeenCalledWith(
      "/api/admin/platform-feedback/id%2Fwith%2Fslash/read",
    );
    vi.mocked(backendHttp.post).mockResolvedValue({
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
  });
});
