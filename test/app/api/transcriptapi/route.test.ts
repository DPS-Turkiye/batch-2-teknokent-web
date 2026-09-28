import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/transcriptapi/route";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

vi.mock("@/lib/transcriptapi", () => ({ fetchMeetingTranscript: vi.fn() }));

describe("assistant transcript API route", () => {
  const sessionId = "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719";
  const headers = { authorization: "Bearer test-token" };
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when session ID is missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/transcriptapi", { headers }),
    );
    expect(response.status).toBe(400);
    expect(fetchMeetingTranscript).not.toHaveBeenCalled();
  });

  it("forwards transcript request with session ID and bearer token", async () => {
    vi.mocked(fetchMeetingTranscript).mockResolvedValue({
      data: {
        segments: [{ id: "s1", speaker: "Ayse", text: "Hello", at: "00:01" }],
      },
      status: 200,
    });
    const response = await GET(
      new NextRequest(
        `http://localhost/api/transcriptapi?sessionId=${sessionId}`,
        { headers },
      ),
    );
    expect(response.status).toBe(200);
    expect(fetchMeetingTranscript).toHaveBeenCalledWith(
      sessionId,
      "test-token",
    );
  });
});
