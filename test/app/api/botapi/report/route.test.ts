import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/botapi/report/route";
import { generateMeetingReportBackend } from "@/lib/botapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", organizationId: "org-1" }),
}));
vi.mock("@/lib/botapi", () => ({
  generateMeetingReportBackend: vi.fn(),
}));

const bearer = { authorization: "Bearer firebase-token" };
const reportUrl =
  "http://localhost/api/botapi/report?platform=google_meet&nativeMeetingId=abc-defg-hij";

describe("assistant report API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required query params are missing", async () => {
    const request = new NextRequest("http://localhost/api/botapi/report", {
      method: "POST",
      headers: bearer,
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(generateMeetingReportBackend).not.toHaveBeenCalled();
  });

  it("answers 401 without the caller's own token", async () => {
    const response = await POST(new NextRequest(reportUrl, { method: "POST" }));

    expect(response.status).toBe(401);
    expect(generateMeetingReportBackend).not.toHaveBeenCalled();
  });

  it("forwards the caller's token and never a client-chosen model or transcript", async () => {
    vi.mocked(generateMeetingReportBackend).mockResolvedValue({
      data: { title: "Mentorluk Gorusmesi" },
      status: 200,
    });

    const response = await POST(
      new NextRequest(reportUrl, {
        method: "POST",
        headers: bearer,
        body: JSON.stringify({
          model: "expensive/model",
          segments: [{ id: "x", speaker: "A", text: "any text", at: "00:00" }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(generateMeetingReportBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      "firebase-token",
    );
  });

  it("answers a localized 403 for a meeting the caller is not part of", async () => {
    vi.mocked(generateMeetingReportBackend).mockResolvedValue({
      data: {
        message: "Only a participant of this meeting can use its assistant.",
      },
      status: 403,
    });

    const response = await POST(
      new NextRequest(reportUrl, { method: "POST", headers: bearer }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns 502 when backend report call throws", async () => {
    vi.mocked(generateMeetingReportBackend).mockRejectedValue(
      new Error("boom"),
    );

    const response = await POST(
      new NextRequest(reportUrl, { method: "POST", headers: bearer }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı raporu hizmetine ulaşılamıyor.",
    });
  });
});
