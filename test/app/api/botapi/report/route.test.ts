import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/botapi/report/route";
import { generateMeetingReportBackend } from "@/lib/botapi";

vi.mock("@/lib/botapi", () => ({
  generateMeetingReportBackend: vi.fn(),
}));

describe("assistant report API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required query params are missing", async () => {
    const request = new NextRequest("http://localhost/api/botapi/report", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(generateMeetingReportBackend).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid request body", async () => {
    const request = new NextRequest(
      "http://localhost/api/botapi/report?platform=google_meet&nativeMeetingId=abc-defg-hij",
      {
        method: "POST",
        body: JSON.stringify({ model: "   " }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(generateMeetingReportBackend).not.toHaveBeenCalled();
  });

  it("forwards valid report requests", async () => {
    vi.mocked(generateMeetingReportBackend).mockResolvedValue({
      data: { title: "Mentorluk Gorusmesi" },
      status: 200,
    });

    const request = new NextRequest(
      "http://localhost/api/botapi/report?platform=google_meet&nativeMeetingId=abc-defg-hij",
      {
        method: "POST",
        body: JSON.stringify({ model: "gpt-5.4" }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(generateMeetingReportBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      { model: "gpt-5.4" },
    );
  });

  it("defaults to empty body when JSON parsing fails", async () => {
    vi.mocked(generateMeetingReportBackend).mockResolvedValue({
      data: { title: "Mentorluk Gorusmesi" },
      status: 200,
    });

    const request = new NextRequest(
      "http://localhost/api/botapi/report?platform=google_meet&nativeMeetingId=abc-defg-hij",
      {
        method: "POST",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(generateMeetingReportBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      {},
    );
  });

  it("returns 502 when backend report call throws", async () => {
    vi.mocked(generateMeetingReportBackend).mockRejectedValue(
      new Error("boom"),
    );

    const request = new NextRequest(
      "http://localhost/api/botapi/report?platform=google_meet&nativeMeetingId=abc-defg-hij",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı raporu hizmetine ulaşılamıyor.",
    });
  });
});
