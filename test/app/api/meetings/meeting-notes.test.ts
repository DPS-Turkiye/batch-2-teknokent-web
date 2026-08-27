import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GET_DOCUMENT } from "@/app/api/meetings/[id]/note/document/route";
import { GET, PUT } from "@/app/api/meetings/[id]/note/route";
import { POST } from "@/app/api/meetings/[id]/todos/route";
import {
  createMeetingTodo,
  fetchMeetingNote,
  fetchMeetingNoteDocument,
  saveMeetingNote,
} from "@/lib/api/meeting-notes";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/meeting-notes", () => ({
  createMeetingTodo: vi.fn(),
  fetchMeetingNote: vi.fn(),
  fetchMeetingNoteDocument: vi.fn(),
  saveMeetingNote: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const params = Promise.resolve({ id: "meeting-1" });

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

  it("forwards a snapshot with the session identity", async () => {
    vi.mocked(saveMeetingNote).mockResolvedValue({
      data: { meetingId: "meeting-1", content: "<p>ok</p>", version: 5 },
      headers: {},
      status: 200,
    });

    const response = await PUT(jsonRequest("PUT", { content: "<p>ok</p>" }), {
      params,
    });

    expect(response.status).toBe(200);
    expect(saveMeetingNote).toHaveBeenCalledWith(
      "meeting-1",
      { userId: "user-1", organizationId: "org-1" },
      { content: "<p>ok</p>" },
    );
  });

  it("rejects a snapshot without content", async () => {
    const response = await PUT(jsonRequest("PUT", {}), { params });

    expect(response.status).toBe(400);
    expect(saveMeetingNote).not.toHaveBeenCalled();
  });

  it("reads the live document state for the room", async () => {
    vi.mocked(fetchMeetingNoteDocument).mockResolvedValue({
      data: { state: "AQID", seedFromSnapshot: false },
      headers: {},
      status: 200,
    });

    const response = await GET_DOCUMENT(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(fetchMeetingNoteDocument).toHaveBeenCalledWith("meeting-1", "org-1");
  });

  it("rejects a blank todo title", async () => {
    const response = await POST(jsonRequest("POST", { title: "   " }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(createMeetingTodo).not.toHaveBeenCalled();
  });
});
