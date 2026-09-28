import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/botapi/report/route";
import { generateMeetingReportBackend } from "@/lib/botapi";

vi.mock("@/lib/botapi", () => ({ generateMeetingReportBackend: vi.fn() }));

describe("assistant report API route", () => {
  const sessionId = "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719";
  const headers = { authorization: "Bearer test-token" };
  const url = `http://localhost/api/botapi/report?sessionId=${sessionId}`;
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing session ID", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/botapi/report", {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects invalid report body", async () => {
    const response = await POST(
      new NextRequest(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: "   " }),
      }),
    );
    expect(response.status).toBe(400);
    expect(generateMeetingReportBackend).not.toHaveBeenCalled();
  });

  it("forwards valid report request with opaque session and token", async () => {
    vi.mocked(generateMeetingReportBackend).mockResolvedValue({
      data: { title: "Meeting" },
      status: 200,
    });
    const response = await POST(
      new NextRequest(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: "gpt-5.4" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(generateMeetingReportBackend).toHaveBeenCalledWith(
      sessionId,
      { model: "gpt-5.4" },
      "test-token",
    );
  });

  it("returns unavailable response when backend call fails", async () => {
    vi.mocked(generateMeetingReportBackend).mockRejectedValue(
      new Error("boom"),
    );
    const response = await POST(
      new NextRequest(url, { method: "POST", headers, body: "{}" }),
    );
    expect(response.status).toBe(502);
  });
});
