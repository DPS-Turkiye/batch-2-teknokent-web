import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/meetings/[meetingId]/note/route";
import { POST } from "@/app/api/meetings/[meetingId]/todos/route";
import {
  createMeetingTodo,
  fetchMeetingNote,
  saveMeetingNote,
} from "@/lib/api/meeting-notes";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/meeting-notes", () => ({
  createMeetingTodo: vi.fn(),
  fetchMeetingNote: vi.fn(),
  saveMeetingNote: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const params = Promise.resolve({ meetingId: "meeting-1" });

function jsonRequest(method: string, body: unknown) {
  return new NextRequest("http://localhost/x", {
    method,
    body: JSON.stringify(body),
  });
}

describe("meeting note API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("reads the note with the organization from the session", async () => {
    vi.mocked(fetchMeetingNote).mockResolvedValue({
      data: { meetingId: "meeting-1", content: "", version: 0 },
      headers: {},
      status: 200,
    });

    const response = await GET(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(fetchMeetingNote).toHaveBeenCalledWith("meeting-1", "org-1");
  });

  it("forwards a save request with the session identity", async () => {
    vi.mocked(saveMeetingNote).mockResolvedValue({
      data: { meetingId: "meeting-1", content: "<p>ok</p>", version: 5 },
      headers: {},
      status: 200,
    });

    const response = await PUT(
      jsonRequest("PUT", { content: "<p>ok</p>", version: 4 }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(saveMeetingNote).toHaveBeenCalledWith(
      "meeting-1",
      { userId: "user-1", organizationId: "org-1" },
      { content: "<p>ok</p>", version: 4 },
    );
  });

  it("rejects a save request without a version", async () => {
    const response = await PUT(jsonRequest("PUT", { content: "<p>ok</p>" }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(saveMeetingNote).not.toHaveBeenCalled();
  });

  it("rejects a blank todo title", async () => {
    const response = await POST(jsonRequest("POST", { title: "   " }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(createMeetingTodo).not.toHaveBeenCalled();
  });
});
