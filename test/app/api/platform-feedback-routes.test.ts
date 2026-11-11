import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/admin/platform-feedback/[id]/read/route";
import { GET } from "@/app/api/admin/platform-feedback/route";
import { POST } from "@/app/api/platform-feedback/route";
import { UserRole } from "@/interfaces/session";
import {
  fetchPlatformFeedbackInbox,
  markPlatformFeedbackRead,
  postPlatformFeedback,
} from "@/lib/api/platform-feedback";
import { requireAdminSession } from "@/lib/server/require-admin";
import { getSessionIds } from "@/lib/session";
import {
  feedbackInbox,
  platformFeedback,
} from "@test/fixtures/platform-feedback";
import { backendRefusal, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/platform-feedback", () => ({
  fetchPlatformFeedbackInbox: vi.fn(),
  markPlatformFeedbackRead: vi.fn(),
  postPlatformFeedback: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const request = (body: unknown) =>
  new Request("http://localhost/api/platform-feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
const params = { params: Promise.resolve({ id: platformFeedback().id }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionIds).mockResolvedValue({
    userId: "signed-in-user",
    organizationId: "",
  });
  vi.mocked(requireAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "signed-in-admin", role: UserRole.Admin }),
  });
  vi.mocked(postPlatformFeedback).mockResolvedValue({
    status: 201,
    data: platformFeedback(),
    headers: {},
  });
  vi.mocked(fetchPlatformFeedbackInbox).mockResolvedValue({
    status: 200,
    data: feedbackInbox(),
    headers: {},
  });
  vi.mocked(markPlatformFeedbackRead).mockResolvedValue({
    status: 200,
    data: platformFeedback(),
    headers: {},
  });
});

describe("platform feedback routes", () => {
  it("takes the sender from the session and strips spoofed identity/read fields", async () => {
    const response = await POST(
      request({
        ...platformFeedback(),
        actorId: "other-user",
        subject: "  Shortcut  ",
        message: "  Please add one.  ",
        readAt: "2026-01-01",
      }),
    );
    expect(response.status).toBe(201);
    expect(postPlatformFeedback).toHaveBeenCalledWith("signed-in-user", {
      kind: "SUGGESTION",
      subject: "Shortcut",
      message: "Please add one.",
      language: "en",
    });
  });

  it("requires a signed-in user before accepting a submission", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });
    expect((await POST(request(platformFeedback()))).status).toBe(401);
    expect(postPlatformFeedback).not.toHaveBeenCalled();
  });

  it.each([
    {},
    null,
    { ...platformFeedback(), kind: "invalid" },
    { ...platformFeedback(), subject: "  " },
    { ...platformFeedback(), subject: "x".repeat(121) },
    { ...platformFeedback(), message: "x".repeat(2001) },
    { ...platformFeedback(), language: "de" },
  ])("rejects an invalid submission (%j)", async (payload) => {
    expect((await POST(request(payload))).status).toBe(400);
    expect(postPlatformFeedback).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost", { method: "POST", body: "not-json" }),
        )
      ).status,
    ).toBe(400);
    expect(postPlatformFeedback).not.toHaveBeenCalled();
  });

  it("uses the admin session identity for inbox and mark-read requests", async () => {
    expect(
      (
        await GET(
          new Request(
            "http://localhost?page=1&unreadOnly=true&actorId=spoofed",
          ),
        )
      ).status,
    ).toBe(200);
    expect(fetchPlatformFeedbackInbox).toHaveBeenCalledWith(
      "signed-in-admin",
      1,
      true,
      undefined,
    );
    expect(
      (
        await PATCH(
          new Request("http://localhost?actorId=spoofed", { method: "PATCH" }),
          params,
        )
      ).status,
    ).toBe(200);
    expect(markPlatformFeedbackRead).toHaveBeenCalledWith(
      "signed-in-admin",
      platformFeedback().id,
    );
  });

  it.each([401, 403] as const)(
    "rejects unauthorized admin access (%s)",
    async (status) => {
      vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(status));
      expect((await GET(new Request("http://localhost"))).status).toBe(status);
      expect(
        (await PATCH(new Request("http://localhost"), params)).status,
      ).toBe(status);
      expect(fetchPlatformFeedbackInbox).not.toHaveBeenCalled();
      expect(markPlatformFeedbackRead).not.toHaveBeenCalled();
    },
  );

  it.each(["page=-1", "page=10001", "page=abc", "page=1.5", "unreadOnly=yes"])(
    "rejects invalid pagination/filter values (%s)",
    async (query) => {
      expect((await GET(new Request(`http://localhost?${query}`))).status).toBe(
        400,
      );
      expect(fetchPlatformFeedbackInbox).not.toHaveBeenCalled();
    },
  );

  it("forwards a program-type filter and refuses an unknown one", async () => {
    await GET(new Request("http://localhost?programType=PEER_MENTORING"));
    expect(fetchPlatformFeedbackInbox).toHaveBeenLastCalledWith(
      "signed-in-admin",
      0,
      false,
      "PEER_MENTORING",
    );
    const refused = await GET(new Request("http://localhost?programType=NOPE"));
    expect(refused.status).toBe(400);
  });

  it("validates feedback identifiers before forwarding mark-read requests", async () => {
    expect(
      (
        await PATCH(new Request("http://localhost"), {
          params: Promise.resolve({ id: "bad-id" }),
        })
      ).status,
    ).toBe(400);
    expect(markPlatformFeedbackRead).not.toHaveBeenCalled();
  });

  it("preserves backend errors and localizes a transport failure", async () => {
    vi.mocked(postPlatformFeedback).mockResolvedValueOnce(backendRefusal(429));
    expect((await POST(request(platformFeedback()))).status).toBe(429);
    vi.mocked(postPlatformFeedback).mockRejectedValueOnce(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request(platformFeedback()));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: "Geri bildirim gönderilemedi. Lütfen tekrar dene.",
    });
  });
});
