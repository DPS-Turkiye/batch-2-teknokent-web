import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailAudience } from "@/interfaces/email-center";
import { backendHttp } from "@/lib/client/backend-http";
import {
  confirmEmailSend,
  getEmailCampaign,
  getEmailCampaigns,
  getEmailCenterOptions,
  getEmailTemplates,
  removeEmailDraft,
  reviewEmailRecipients,
  saveEmailDraft,
  sendEmailTest,
  stopEmailSend,
  unsubscribeFromEmails,
} from "@/lib/client/email-center";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const draft = {
  programId: "p",
  audience: EmailAudience.Mentors,
  subject: "Konu",
  bodyHtml: "<p>a</p>",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const method of ["get", "post", "put", "delete"] as const)
    vi.mocked(backendHttp[method]).mockResolvedValue(
      createAxiosResponse({}, 200),
    );
  vi.spyOn(httpClient, "post").mockResolvedValue(createAxiosResponse({}, 200));
});

// The backend takes the sender from the session: nothing here names the caller.
describe("email center client, straight to the backend", () => {
  it("reads", async () => {
    await getEmailCenterOptions();
    await getEmailCampaigns();
    await getEmailCampaign("a/b");
    await getEmailTemplates("p");
    expect(vi.mocked(backendHttp.get).mock.calls).toEqual([
      ["/api/email-center/options"],
      ["/api/email-center/campaigns"],
      ["/api/email-center/campaigns/a%2Fb"],
      ["/api/email-center/templates", { params: { programId: "p" } }],
    ]);
  });

  it("creates a new draft and updates a saved one, with the subject trimmed", async () => {
    await saveEmailDraft(null, draft);
    await saveEmailDraft("id", { ...draft, subject: "  Konu " });
    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/email-center/campaigns",
      draft,
    );
    expect(backendHttp.put).toHaveBeenCalledWith(
      "/api/email-center/campaigns/id",
      draft,
    );
  });

  it("tests, reviews, confirms and deletes", async () => {
    const confirmation = {
      reviewDigest: "d",
      untickedIds: ["x"],
      expectedCount: 1,
    };
    await sendEmailTest("id");
    await reviewEmailRecipients("id");
    await confirmEmailSend("id", confirmation);
    await stopEmailSend("id");
    await removeEmailDraft("id");
    expect(vi.mocked(backendHttp.post).mock.calls).toEqual([
      ["/api/email-center/campaigns/id/test"],
      ["/api/email-center/campaigns/id/review"],
      ["/api/email-center/campaigns/id/send", confirmation],
      ["/api/email-center/campaigns/id/stop"],
    ]);
    expect(backendHttp.delete).toHaveBeenCalledWith(
      "/api/email-center/campaigns/id",
    );
  });

  it("refuses a step the backend refuses", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue(
      createAxiosResponse({ message: "Yetkin yok.", code: "FORBIDDEN" }, 403),
    );
    await expect(sendEmailTest("id")).rejects.toMatchObject({
      status: 403,
      message: "Yetkin yok.",
    });
  });

  it("says a text is too long before the firewall drops it", async () => {
    await expect(
      saveEmailDraft(null, { ...draft, bodyHtml: "a".repeat(7_000) }),
    ).rejects.toThrow();
    expect(backendHttp.post).not.toHaveBeenCalled();
  });

  it("unsubscribes through this app's own route, which mail programs also post to", async () => {
    await unsubscribeFromEmails("a-b");
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/email-unsubscribe?t=a-b",
    );
  });
});
