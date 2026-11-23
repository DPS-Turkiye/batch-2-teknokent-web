import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as review } from "@/app/api/email-center/campaigns/[id]/review/route";
import {
  GET as detail,
  DELETE as remove,
  PUT as update,
} from "@/app/api/email-center/campaigns/[id]/route";
import { POST as send } from "@/app/api/email-center/campaigns/[id]/send/route";
import { POST as stop } from "@/app/api/email-center/campaigns/[id]/stop/route";
import { POST as sendTest } from "@/app/api/email-center/campaigns/[id]/test/route";
import {
  POST as create,
  GET as list,
} from "@/app/api/email-center/campaigns/route";
import { GET as options } from "@/app/api/email-center/options/route";
import { GET as templates } from "@/app/api/email-center/templates/route";
import { POST as unsubscribe } from "@/app/api/email-unsubscribe/route";
import { EmailAudience } from "@/interfaces/email-center";
import { UserRole } from "@/interfaces/session";
import * as backend from "@/lib/api/email-center";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerAllWith200,
  itChecksTheBody,
  jsonRequest,
} from "@test/app/api/body-validation";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/email-center");
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const ID = "30000000-0000-4000-8000-000000000001";
const PROGRAM = "10000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ id: ID }) };
const draft = {
  programId: PROGRAM,
  audience: EmailAudience.Mentors,
  subject: "Konu",
  bodyHtml: "<p>Metin</p>",
};
const confirmation = { reviewDigest: "d", untickedIds: [ID], expectedCount: 2 };
const get = (url = "http://localhost/api") => new Request(url);

beforeEach(() => {
  vi.clearAllMocks();
  answerAllWith200(backend);
  vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "signed-in", role: UserRole.Coordinator }),
  });
});

const invalidDraft = {
  "no program": { ...draft, programId: "x" },
  "an unknown audience": { ...draft, audience: "ALL" },
  "a blank subject": { ...draft, subject: "  " },
  "a header in the subject": { ...draft, subject: "a\r\nBcc: x@y.z" },
  "no text": { ...draft, bodyHtml: "" },
};

describe.each([
  {
    route: "create",
    send: create,
    valid: withForgedActor(draft),
    backend: backend.createEmailCampaign,
    expected: ["signed-in", draft],
    invalid: invalidDraft,
  },
  {
    route: "update",
    send: (request: Request) => update(request, context),
    method: "PUT",
    valid: withForgedActor(draft),
    backend: backend.updateEmailCampaign,
    expected: ["signed-in", ID, draft],
    invalid: invalidDraft,
  },
  {
    route: "send",
    send: (request: Request) => send(request, context),
    valid: withForgedActor(confirmation),
    backend: backend.sendEmailCampaign,
    expected: ["signed-in", ID, confirmation],
    invalid: {
      "no review": { ...confirmation, reviewDigest: "" },
      "nobody left": { ...confirmation, expectedCount: 0 },
      "a half person": { ...confirmation, expectedCount: 1.5 },
      "an id that is not one": { ...confirmation, untickedIds: ["x"] },
    },
  },
])("$route body", (bodyCase) => {
  itChecksTheBody(bodyCase);
});

const calls = {
  options: () => options(),
  templates: () => templates(get(`http://localhost/api?programId=${PROGRAM}`)),
  list: () => list(),
  detail: () => detail(get(), context),
  create: () => create(jsonRequest(draft)),
  update: () => update(jsonRequest(draft, "PUT"), context),
  remove: () => remove(get(), context),
  test: () => sendTest(get(), context),
  review: () => review(get(), context),
  stop: () => stop(get(), context),
  send: () => send(jsonRequest(confirmation), context),
};

describe("email center routes", () => {
  it.each(Object.entries(calls))(
    "%s refuses everybody who is neither coordinator nor admin",
    async (_name, call) => {
      vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
        guardRefusal(403),
      );
      expect((await call()).status).toBe(403);
      for (const mocked of Object.values(backend))
        expect(mocked).not.toHaveBeenCalled();
    },
  );

  it("acts as the signed-in person", async () => {
    await calls.options();
    await calls.templates();
    await calls.list();
    await calls.detail();
    await calls.remove();
    await calls.test();
    await calls.review();
    await calls.stop();
    expect(backend.stopEmailCampaign).toHaveBeenCalledWith("signed-in", ID);
    expect(backend.fetchEmailCenterOptions).toHaveBeenCalledWith("signed-in");
    expect(backend.fetchEmailTemplates).toHaveBeenCalledWith(
      "signed-in",
      PROGRAM,
    );
    expect(backend.fetchEmailCampaigns).toHaveBeenCalledWith("signed-in");
    expect(backend.fetchEmailCampaign).toHaveBeenCalledWith("signed-in", ID);
    expect(backend.deleteEmailCampaign).toHaveBeenCalledWith("signed-in", ID);
    expect(backend.testEmailCampaign).toHaveBeenCalledWith("signed-in", ID);
    expect(backend.reviewEmailCampaign).toHaveBeenCalledWith("signed-in", ID);
  });

  it.each(Object.entries(calls))(
    "%s answers 502 when the backend cannot be reached",
    async (_name, call) => {
      for (const mocked of Object.values(backend))
        vi.mocked(mocked).mockRejectedValue(new Error("down"));
      expect((await call()).status).toBe(502);
    },
  );

  it("refuses templates without a program", async () => {
    expect((await templates(get())).status).toBe(400);
  });
});

describe("unsubscribing", () => {
  const token = "a".repeat(43);
  const post = (query: string) =>
    unsubscribe(
      new Request(`http://localhost/api/email-unsubscribe${query}`, {
        method: "POST",
        body: "List-Unsubscribe=One-Click",
      }),
    );

  it("needs no session, only the link's token", async () => {
    vi.mocked(backend.unsubscribeEmail).mockResolvedValue(
      backendResponse(null, 204),
    );
    const response = await post(`?t=${token}`);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(backend.unsubscribeEmail).toHaveBeenCalledWith(token);
    expect(requireCoordinatorOrAdminSession).not.toHaveBeenCalled();
  });

  it.each(["", "?t=", "?t=short", `?t=${"a".repeat(30)}%2F..`])(
    "refuses %s",
    async (query) => {
      expect((await post(query)).status).toBe(400);
      expect(backend.unsubscribeEmail).not.toHaveBeenCalled();
    },
  );

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(backend.unsubscribeEmail).mockRejectedValue(new Error("down"));
    expect((await post(`?t=${token}`)).status).toBe(502);
  });
});
