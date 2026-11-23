import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailAudience } from "@/interfaces/email-center";
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

const draft = {
  programId: "p",
  audience: EmailAudience.Mentors,
  subject: "Konu",
  bodyHtml: "<p>a</p>",
};

beforeEach(() => {
  vi.restoreAllMocks();
  for (const method of ["get", "post", "put", "delete"] as const)
    vi.spyOn(httpClient, method).mockResolvedValue(
      createAxiosResponse({}, 200),
    );
});

describe("email center client", () => {
  it("reads", async () => {
    await getEmailCenterOptions();
    await getEmailCampaigns();
    await getEmailCampaign("a/b");
    await getEmailTemplates("p");
    expect(vi.mocked(httpClient.get).mock.calls).toEqual([
      ["/api/email-center/options"],
      ["/api/email-center/campaigns"],
      ["/api/email-center/campaigns/a%2Fb"],
      ["/api/email-center/templates", { params: { programId: "p" } }],
    ]);
  });

  it("creates a new draft and updates a saved one", async () => {
    await saveEmailDraft(null, draft);
    await saveEmailDraft("id", draft);
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/email-center/campaigns",
      draft,
    );
    expect(httpClient.put).toHaveBeenCalledWith(
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
    expect(vi.mocked(httpClient.post).mock.calls).toEqual([
      ["/api/email-center/campaigns/id/test"],
      ["/api/email-center/campaigns/id/review"],
      ["/api/email-center/campaigns/id/send", confirmation],
      ["/api/email-center/campaigns/id/stop"],
    ]);
    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/email-center/campaigns/id",
    );
  });

  it("says a text is too long before the hosting drops it", async () => {
    await expect(
      saveEmailDraft(null, { ...draft, bodyHtml: "a".repeat(7_000) }),
    ).rejects.toThrow();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it("unsubscribes with the link's token", async () => {
    await unsubscribeFromEmails("a-b");
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/email-unsubscribe?t=a-b",
    );
  });
});
