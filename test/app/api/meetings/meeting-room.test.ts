import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as inviteGuest } from "@/app/api/meetings/[id]/guests/route";
import { GET as getRoom } from "@/app/api/meetings/[id]/room/route";
import { DELETE } from "@/app/api/meetings/[id]/route";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import {
  deleteMeeting,
  fetchMeetingRoom,
  fetchMeetings,
  inviteMeetingGuest,
} from "@/lib/api/meetings";
import { fetchPrograms } from "@/lib/api/programs";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/meetings", () => ({
  fetchMeetings: vi.fn(),
  fetchMeetingRoom: vi.fn(),
  inviteMeetingGuest: vi.fn(),
  deleteMeeting: vi.fn(),
}));

vi.mock("@/lib/api/programs", () => ({
  fetchPrograms: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "m1" }) };

function signInAsMentor() {
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "mentor-1",
    email: "leyla@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
  });
}

describe("meeting room routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMeetings).mockResolvedValue({
      data: [{ id: "m1", organizationId: "org-1" }],
      headers: {},
      status: 200,
    });
    vi.mocked(fetchMeetingRoom).mockResolvedValue({
      data: [{ id: "m1" }],
      headers: {},
      status: 200,
    });
    vi.mocked(inviteMeetingGuest).mockResolvedValue({
      data: { id: "m2" },
      headers: {},
      status: 201,
    });
    vi.mocked(deleteMeeting).mockResolvedValue({
      data: null,
      headers: {},
      status: 204,
    });
  });

  it("loads the room for the mentor who owns the meeting", async () => {
    signInAsMentor();
    const response = await getRoom(new Request("http://localhost"), params);
    expect(response.status).toBe(200);
    expect(fetchMeetingRoom).toHaveBeenCalledWith("m1");
  });

  it("invites another program mentor onto the meeting", async () => {
    signInAsMentor();
    vi.mocked(fetchPrograms).mockResolvedValue({
      data: [
        {
          id: "prog-1",
          mentors: [
            { mentorId: "mentor-1", status: ProgramMentorStatus.Accepted },
            { mentorId: "mentor-2", status: ProgramMentorStatus.Accepted },
          ],
          startups: [{ id: "org-1", name: "Döngü" }],
        },
      ],
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchPrograms>>);

    const response = await inviteGuest(
      new NextRequest("http://localhost/api/meetings/m1/guests", {
        method: "POST",
        body: JSON.stringify({ mentorId: "mentor-2", organizationId: "org-1" }),
      }),
      params,
    );

    expect(response.status).toBe(201);
    expect(inviteMeetingGuest).toHaveBeenCalledWith("m1", {
      mentorId: "mentor-2",
      organizationId: "org-1",
    });
  });

  it("deletes the meeting room", async () => {
    signInAsMentor();
    const response = await DELETE(
      new NextRequest("http://localhost/api/meetings/m1", { method: "DELETE" }),
      params,
    );
    expect(response.status).toBe(204);
    expect(deleteMeeting).toHaveBeenCalledWith("m1");
  });
});
