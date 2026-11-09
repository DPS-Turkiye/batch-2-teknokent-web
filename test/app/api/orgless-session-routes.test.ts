import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getDashboardSummary } from "@/app/api/dashboard/summary/route";
import { GET as getMeetings } from "@/app/api/meetings/route";
import { GET as getMentorRequests } from "@/app/api/mentor-requests/route";
import { POST as postManualProfile } from "@/app/api/profile-analysis/manual/route";
import { GET as getProfileAnalysis } from "@/app/api/profile-analysis/route";
import { UserRole } from "@/interfaces/session";
import { fetchDashboardSummary } from "@/lib/api/dashboard";
import { fetchMeetings } from "@/lib/api/meetings";
import {
  fetchMentorRequests,
  fetchMentorRequestsPage,
} from "@/lib/api/mentor-requests";
import {
  createManualProfileAnalysis,
  fetchLatestProfileAnalysis,
} from "@/lib/api/profile-analysis";
import { getSessionIds, getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/dashboard", () => ({ fetchDashboardSummary: vi.fn() }));
vi.mock("@/lib/api/meetings", () => ({
  fetchMeetings: vi.fn(),
  createMeeting: vi.fn(),
}));
vi.mock("@/lib/api/mentor-requests", () => ({
  fetchMentorRequests: vi.fn(),
  fetchMentorRequestsPage: vi.fn(),
  fetchMentorRequest: vi.fn(),
  createMentorRequest: vi.fn(),
}));
vi.mock("@/lib/api/programs", () => ({ fetchPrograms: vi.fn() }));
vi.mock("@/lib/api/profile-analysis", () => ({
  fetchLatestProfileAnalysis: vi.fn(),
  createManualProfileAnalysis: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
  getSessionUser: vi.fn(),
}));

// A signed-in mentee who has no startup yet. Its organization is blank, and the backend used to read a blank
// list filter as "no filter" and answer with every row on the platform.
describe("a session without a startup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "student-1",
      organizationId: "",
    });
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "student-1",
      email: "ogrenci@odtu.example",
      fullName: "Öğrenci",
      jobTitle: "",
      role: UserRole.Mentee,
    });
  });

  it("gets no mentorship requests, and the backend is never asked", async () => {
    const response = await getMentorRequests(
      new NextRequest("http://localhost/api/mentor-requests"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(fetchMentorRequests).not.toHaveBeenCalled();
  });

  it("gets an empty page of mentorship requests", async () => {
    const response = await getMentorRequests(
      new NextRequest(
        "http://localhost/api/mentor-requests?tab=requests&page=2&size=5",
      ),
    );

    expect(await response.json()).toEqual({
      content: [],
      page: 2,
      size: 5,
      totalElements: 0,
      totalPages: 0,
    });
    expect(fetchMentorRequestsPage).not.toHaveBeenCalled();
  });

  it("gets no meetings", async () => {
    const response = await getMeetings(
      new NextRequest("http://localhost/api/meetings"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(fetchMeetings).not.toHaveBeenCalled();
  });

  it("gets no platform-wide dashboard counts", async () => {
    const response = await getDashboardSummary();

    expect(response.status).toBe(403);
    expect(fetchDashboardSummary).not.toHaveBeenCalled();
  });

  // Without an organization the backend falls back to the seeded demo startup.
  it("cannot read or write a startup profile analysis", async () => {
    const read = await getProfileAnalysis(
      new NextRequest("http://localhost/api/profile-analysis"),
    );
    const write = await postManualProfile(
      new NextRequest("http://localhost/api/profile-analysis/manual", {
        method: "POST",
        body: JSON.stringify({ summary: "x" }),
      }),
    );

    expect(read.status).toBe(403);
    expect(write.status).toBe(403);
    expect(fetchLatestProfileAnalysis).not.toHaveBeenCalled();
    expect(createManualProfileAnalysis).not.toHaveBeenCalled();
  });
});
