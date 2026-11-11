import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH as updateMeetingRoute } from "@/app/api/meetings/[id]/route";
import { GET as getMentorship } from "@/app/api/mentorships/[id]/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchMeetings, updateMeeting } from "@/lib/api/meetings";
import { fetchRegularMentorship } from "@/lib/api/mentorships";
import { HttpMethod } from "@/lib/http-method";
import { getSessionIds, getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/meetings", () => ({
  deleteMeeting: vi.fn(),
  fetchMeetings: vi.fn(),
  updateMeeting: vi.fn(),
}));
vi.mock("@/lib/api/mentorships", () => ({
  deleteRegularMentorship: vi.fn(),
  fetchRegularMentorship: vi.fn(),
  updateRegularMentorship: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
  getSessionUser: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "target-1" }) };
const ok = { data: {}, headers: {}, status: 200 };

const mentor: AppSession = {
  userId: "mentor-1",
  email: "mentor@example.com",
  fullName: "Mentor",
  jobTitle: "Mentor",
  role: UserRole.Mentor,
};
const founder: AppSession = {
  userId: "founder-1",
  email: "founder@example.com",
  fullName: "Founder",
  jobTitle: "Kurucu",
  role: UserRole.Mentee,
  organizationId: "org-1",
  organizationName: "Startup",
};

function patchMeeting() {
  return updateMeetingRoute(
    new NextRequest("http://localhost/x", {
      method: HttpMethod.Patch,
      body: JSON.stringify({ status: "COMPLETED" }),
    }),
    params,
  );
}

function meetingsList(ids: string[]) {
  return { data: ids.map((id) => ({ id })), headers: {}, status: 200 };
}

describe("PATCH /api/meetings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateMeeting).mockResolvedValue(ok);
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await patchMeeting()).status).toBe(401);
    expect(updateMeeting).not.toHaveBeenCalled();
  });

  it("lets a mentor change their own meeting", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mentor);
    vi.mocked(fetchMeetings).mockResolvedValue(meetingsList(["target-1"]));

    expect((await patchMeeting()).status).toBe(200);
    expect(fetchMeetings).toHaveBeenCalledWith({ mentorId: "mentor-1" });
  });

  it("lets a startup member change their startup's meeting", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founder);
    vi.mocked(fetchMeetings).mockResolvedValue(meetingsList(["target-1"]));

    expect((await patchMeeting()).status).toBe(200);
    expect(fetchMeetings).toHaveBeenCalledWith({ organizationId: "org-1" });
  });

  it("hides someone else's meeting", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founder);
    vi.mocked(fetchMeetings).mockResolvedValue(meetingsList(["other"]));

    expect((await patchMeeting()).status).toBe(404);
    expect(updateMeeting).not.toHaveBeenCalled();
  });

  it("refuses roles that own no meetings", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      ...mentor,
      role: UserRole.Coordinator,
    });

    expect((await patchMeeting()).status).toBe(403);
    expect(updateMeeting).not.toHaveBeenCalled();
  });
});

describe("GET /api/mentorships/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchRegularMentorship).mockResolvedValue({
      data: { id: "target-1", mentorId: "mentor-1", organizationId: "org-1" },
      headers: {},
      status: 200,
    });
  });

  it("returns the mentorship to its mentor", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentor-1",
      organizationId: "",
    });

    expect((await getMentorship(new Request("http://x"), params)).status).toBe(
      200,
    );
  });

  it("returns the mentorship to its startup", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "founder-1",
      organizationId: "org-1",
    });

    expect((await getMentorship(new Request("http://x"), params)).status).toBe(
      200,
    );
  });

  it("hides it from everyone else", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "founder-2",
      organizationId: "org-2",
    });

    expect((await getMentorship(new Request("http://x"), params)).status).toBe(
      404,
    );
  });
});
