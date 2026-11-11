import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/transcriptapi/route";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", organizationId: "org-1" }),
}));
vi.mock("@/lib/transcriptapi", () => ({
  fetchMeetingTranscript: vi.fn(),
}));

const bearer = { authorization: "Bearer firebase-token" };
const query =
  "http://localhost/api/transcriptapi?platform=google_meet&nativeMeetingId=abc-defg-hij";

describe("assistant transcript API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when transcript query params are missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/transcriptapi", {
        headers: bearer,
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMeetingTranscript).not.toHaveBeenCalled();
  });

  it("forwards transcript responses with backend status", async () => {
    vi.mocked(fetchMeetingTranscript).mockResolvedValue({
      data: {
        segments: [{ id: "s1", speaker: "Ayse", text: "Hello", at: "00:01" }],
      },
      status: 200,
    });

    const response = await GET(new NextRequest(query, { headers: bearer }));

    expect(response.status).toBe(200);
    expect(fetchMeetingTranscript).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      "firebase-token",
    );
  });

  it("returns 502 when transcript backend call fails", async () => {
    vi.mocked(fetchMeetingTranscript).mockRejectedValue(new Error("boom"));

    const response = await GET(new NextRequest(query, { headers: bearer }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı transkript hizmetine ulaşılamıyor.",
    });
  });

  it("answers 401 without the caller's own token, so the shared login never acts for anybody", async () => {
    const response = await GET(new NextRequest(query));

    expect(response.status).toBe(401);
    expect(fetchMeetingTranscript).not.toHaveBeenCalled();
  });

  it("answers a localized 403 for a meeting the caller is not part of", async () => {
    vi.mocked(fetchMeetingTranscript).mockResolvedValue({
      data: {
        message: "Only a participant of this meeting can use its assistant.",
      },
      status: 403,
    });

    const response = await GET(new NextRequest(query, { headers: bearer }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message:
        "Bu toplantının asistanını yalnızca toplantının katılımcıları kullanabilir.",
    });
  });

  it("answers a localized 404 for a Meet code with no meeting", async () => {
    vi.mocked(fetchMeetingTranscript).mockResolvedValue({
      data: { message: "Meeting not found." },
      status: 404,
    });

    const response = await GET(new NextRequest(query, { headers: bearer }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
