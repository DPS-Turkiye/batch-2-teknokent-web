import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/meetings/[id]/assistant-share/route";
import {
  fetchAssistantShare,
  publishAssistantShare,
} from "@/lib/api/meeting-notes";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";
import { UserRole } from "@/interfaces/session";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/meeting-notes", () => ({
  fetchAssistantShare: vi.fn(),
  publishAssistantShare: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireMentorSession: vi.fn(),
}));

const params = Promise.resolve({ id: "meeting-1" });

describe("assistant share API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the share as the meeting mentor", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentor-1",
      email: "leyla@teknokent.demo",
      fullName: "Leyla Aksoy",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
    });
    vi.mocked(fetchAssistantShare).mockResolvedValue({
      data: { meetingId: "meeting-1", transcript: null, report: null },
      headers: {},
      status: 200,
    });

    const response = await GET(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(fetchAssistantShare).toHaveBeenCalledWith("meeting-1", {
      viewerId: "mentor-1",
    });
  });

  it("reads the share for the mentee organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentee-1",
      email: "ayse@novamed.demo",
      fullName: "Ayşe Kaya",
      jobTitle: "Mentee",
      role: UserRole.Mentee,
      organizationId: "org-1",
      organizationName: "NovaMed",
    });
    vi.mocked(fetchAssistantShare).mockResolvedValue({
      data: { meetingId: "meeting-1", transcript: null, report: null },
      headers: {},
      status: 200,
    });

    const response = await GET(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(fetchAssistantShare).toHaveBeenCalledWith("meeting-1", {
      organizationId: "org-1",
    });
  });

  it("publishes a transcript for the signed-in mentor", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "mentor-1",
        email: "leyla@teknokent.demo",
        fullName: "Leyla Aksoy",
        jobTitle: "Mentor",
        role: UserRole.Mentor,
      },
    });
    vi.mocked(publishAssistantShare).mockResolvedValue({
      data: { meetingId: "meeting-1" },
      headers: {},
      status: 200,
    });

    const response = await POST(
      new NextRequest("http://localhost/x", {
        method: "POST",
        body: JSON.stringify({
          kind: "TRANSCRIPT",
          transcript: [
            { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
          ],
        }),
      }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(publishAssistantShare).toHaveBeenCalledWith(
      "meeting-1",
      "mentor-1",
      {
        kind: "TRANSCRIPT",
        transcript: [
          { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
        ],
      },
    );
  });

  it("accepts a transcript payload with missing speaker and id", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "mentor-1",
        email: "leyla@teknokent.demo",
        fullName: "Leyla Aksoy",
        jobTitle: "Mentor",
        role: UserRole.Mentor,
      },
    });
    vi.mocked(publishAssistantShare).mockResolvedValue({
      data: { meetingId: "meeting-1" },
      headers: {},
      status: 200,
    });

    const response = await POST(
      new NextRequest("http://localhost/x", {
        method: "POST",
        body: JSON.stringify({
          kind: "TRANSCRIPT",
          transcript: [{ text: "Merhaba", at: "00:10", speaker: null }],
        }),
      }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(publishAssistantShare).toHaveBeenCalledWith(
      "meeting-1",
      "mentor-1",
      {
        kind: "TRANSCRIPT",
        transcript: [
          {
            id: "00:10-Merhaba",
            speaker: "Speaker",
            text: "Merhaba",
            at: "00:10",
          },
        ],
      },
    );
  });

  it("rejects a mentee publish", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await POST(
      new NextRequest("http://localhost/x", {
        method: "POST",
        body: JSON.stringify({
          kind: "TRANSCRIPT",
          transcript: [
            { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
          ],
        }),
      }),
      { params },
    );

    expect(response.status).toBe(403);
    expect(publishAssistantShare).not.toHaveBeenCalled();
  });
});
