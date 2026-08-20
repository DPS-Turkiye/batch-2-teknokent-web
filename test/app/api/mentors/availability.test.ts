import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/mentors/[id]/availability/route";
import { DELETE } from "@/app/api/mentors/[id]/availability/[slotId]/route";
import {
  createMentorAvailability,
  deleteMentorAvailability,
  fetchMentorAvailability,
} from "@/lib/api/mentors";
import { getSessionMentorId } from "@/lib/session";

vi.mock("@/lib/api/mentors", () => ({
  createMentorAvailability: vi.fn(),
  deleteMentorAvailability: vi.fn(),
  fetchMentorAvailability: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionMentorId: vi.fn(),
}));

describe("GET /api/mentors/[id]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not require session ownership to list availability", async () => {
    vi.mocked(fetchMentorAvailability).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    const response = await GET(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ id: "mentor-1" }),
    });

    expect(response.status).toBe(200);
    expect(fetchMentorAvailability).toHaveBeenCalledWith("mentor-1");
  });
});

describe("POST /api/mentors/[id]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects creating a slot for another mentor", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");

    const request = new NextRequest("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ startsAt: "2026-08-21T10:00:00.000Z" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "another-mentor" }),
    });

    expect(response.status).toBe(403);
    expect(createMentorAvailability).not.toHaveBeenCalled();
  });

  it("creates a slot when the session matches the target mentor", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");
    vi.mocked(createMentorAvailability).mockResolvedValue({
      data: { id: "slot-1" },
      headers: {},
      status: 201,
    });

    const request = new NextRequest("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ startsAt: "2026-08-21T10:00:00.000Z" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "mentor-1" }),
    });

    expect(response.status).toBe(201);
    expect(createMentorAvailability).toHaveBeenCalledWith("mentor-1", {
      startsAt: "2026-08-21T10:00:00.000Z",
    });
  });
});

describe("DELETE /api/mentors/[id]/availability/[slotId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects deleting another mentor's slot", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");

    const response = await DELETE(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ id: "another-mentor", slotId: "slot-1" }),
    });

    expect(response.status).toBe(403);
    expect(deleteMentorAvailability).not.toHaveBeenCalled();
  });

  it("deletes the slot when the session matches the target mentor", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");
    vi.mocked(deleteMentorAvailability).mockResolvedValue({
      data: undefined,
      headers: {},
      status: 204,
    });

    const response = await DELETE(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ id: "mentor-1", slotId: "slot-1" }),
    });

    expect(response.status).toBe(204);
    expect(deleteMentorAvailability).toHaveBeenCalledWith("mentor-1", "slot-1");
  });
});
