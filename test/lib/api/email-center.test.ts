import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailAudience } from "@/interfaces/email-center";
import {
  createEmailCampaign,
  deleteEmailCampaign,
  fetchEmailCampaign,
  fetchEmailCampaigns,
  fetchEmailCenterOptions,
  fetchEmailTemplates,
  reviewEmailCampaign,
  sendEmailCampaign,
  testEmailCampaign,
  unsubscribeEmail,
  updateEmailCampaign,
} from "@/lib/api/email-center";
import { backendRequest } from "@/lib/server/backend-client";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

const draft = {
  programId: "p",
  audience: EmailAudience.Mentors,
  subject: "Konu",
  bodyHtml: "<p>a</p>",
};
const confirmation = { reviewDigest: "d", untickedIds: [], expectedCount: 1 };
const BASE = "/api/email-center";

beforeEach(() => {
  vi.mocked(backendRequest).mockReset().mockResolvedValue(backendResponse({}));
});

describe("email center backend calls", () => {
  it.each([
    [
      () => fetchEmailCenterOptions("me"),
      { method: "GET", url: `${BASE}/options`, params: { actorId: "me" } },
    ],
    [
      () => fetchEmailTemplates("me", "p"),
      {
        method: "GET",
        url: `${BASE}/templates`,
        params: { actorId: "me", programId: "p" },
      },
    ],
    [
      () => fetchEmailCampaigns("me"),
      { method: "GET", url: `${BASE}/campaigns`, params: { actorId: "me" } },
    ],
    [
      () => fetchEmailCampaign("me", "a/b"),
      {
        method: "GET",
        url: `${BASE}/campaigns/a%2Fb`,
        params: { actorId: "me" },
      },
    ],
    [
      () => createEmailCampaign("me", draft),
      {
        method: "POST",
        url: `${BASE}/campaigns`,
        data: { ...draft, actorId: "me" },
      },
    ],
    [
      () => updateEmailCampaign("me", "id", draft),
      {
        method: "PUT",
        url: `${BASE}/campaigns/id`,
        data: { ...draft, actorId: "me" },
      },
    ],
    [
      () => deleteEmailCampaign("me", "id"),
      {
        method: "DELETE",
        url: `${BASE}/campaigns/id`,
        params: { actorId: "me" },
      },
    ],
    [
      () => testEmailCampaign("me", "id"),
      {
        method: "POST",
        url: `${BASE}/campaigns/id/test`,
        data: { actorId: "me" },
      },
    ],
    [
      () => reviewEmailCampaign("me", "id"),
      {
        method: "POST",
        url: `${BASE}/campaigns/id/review`,
        data: { actorId: "me" },
      },
    ],
    [
      () => sendEmailCampaign("me", "id", confirmation),
      {
        method: "POST",
        url: `${BASE}/campaigns/id/send`,
        data: { ...confirmation, actorId: "me" },
      },
    ],
    [
      () => unsubscribeEmail("t"),
      { method: "POST", url: `${BASE}/unsubscribe`, data: { token: "t" } },
    ],
  ])("asks for exactly what is needed (%#)", async (call, expected) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(expected);
  });
});
