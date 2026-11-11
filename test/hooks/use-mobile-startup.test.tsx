import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileStartup } from "@/hooks/use-mobile-startup";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingFrequency } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getActionItems } from "@/lib/client/action-items";
import { getMeetings } from "@/lib/client/meetings";
import { getMentorProfile } from "@/lib/client/mentor-profile";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getPrograms } from "@/lib/client/programs";
import { getOrganizationDocuments } from "@/lib/client/startup-documents";
import { MOBILE_STARTUPS } from "@/lib/mobile";
import {
  menteeActionItemFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { mentorProfile } from "@test/fixtures/mentors";
import { queryWrapper } from "@test/fixtures/query-wrapper";
import { memberFixture } from "@test/fixtures/startup-team";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentor-1" } }),
}));
vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/meetings", () => ({ getMeetings: vi.fn() }));
vi.mock("@/lib/client/programs", () => ({ getPrograms: vi.fn() }));
vi.mock("@/lib/client/mentor-profile", () => ({ getMentorProfile: vi.fn() }));
vi.mock("@/lib/client/organization-members", () => ({
  getOrganizationMembersById: vi.fn(),
}));
vi.mock("@/lib/client/startup-documents", () => ({
  getOrganizationDocuments: vi.fn(),
}));
vi.mock("@/lib/client/action-items", () => ({ getActionItems: vi.fn() }));

const older = menteeRequestFixture({
  id: "older",
  organizationId: "atlas",
  status: MentorshipRequestStatus.Accepted,
  createdAt: "2026-01-01T10:00:00Z",
});
const newer = menteeRequestFixture({
  id: "newer",
  organizationId: "atlas",
  status: MentorshipRequestStatus.Accepted,
  createdAt: "2026-05-01T10:00:00Z",
});
const pendingNewest = menteeRequestFixture({
  id: "pending",
  organizationId: "atlas",
  status: MentorshipRequestStatus.Pending,
  createdAt: "2026-08-01T10:00:00Z",
});
const otherStartup = menteeRequestFixture({
  id: "other",
  organizationId: "lumen",
  status: MentorshipRequestStatus.Accepted,
  createdAt: "2026-09-01T10:00:00Z",
});

async function renderStartup(organizationId = "atlas") {
  const view = renderHook(
    () => useMobileStartup(organizationId),
    queryWrapper(),
  );
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe("useMobileStartup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorRequests).mockResolvedValue([
      older,
      pendingNewest,
      newer,
      otherStartup,
    ]);
    vi.mocked(getMeetings).mockResolvedValue([]);
    vi.mocked(getPrograms).mockResolvedValue([]);
    vi.mocked(getMentorProfile).mockResolvedValue({
      ...mentorProfile,
      meetingFrequency: MeetingFrequency.Biweekly,
    });
    vi.mocked(getOrganizationMembersById).mockResolvedValue([
      memberFixture("lead", { fullName: "Ada Kaya", founder: true }),
      memberFixture("dev", { fullName: "Can Er" }),
    ]);
    vi.mocked(getOrganizationDocuments).mockResolvedValue([]);
    vi.mocked(getActionItems).mockResolvedValue([
      menteeActionItemFixture({ id: "a", status: ActionItemStatus.Completed }),
      menteeActionItemFixture({ id: "b", status: ActionItemStatus.Open }),
      menteeActionItemFixture({ id: "c", status: ActionItemStatus.Cancelled }),
    ]);
  });

  it("reads the mentor's side of the requests and this startup's team and files", async () => {
    await renderStartup();

    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentor);
    expect(getOrganizationMembersById).toHaveBeenCalledWith("atlas");
    expect(getOrganizationDocuments).toHaveBeenCalledWith("atlas");
  });

  it("reads the tasks of the startup's newest accepted mentorship", async () => {
    const { result } = await renderStartup();

    await waitFor(() =>
      expect(result.current.detail?.tasks).toBe("1 / 2 tamamlandı"),
    );
    expect(getActionItems).toHaveBeenCalledWith("newer");
  });

  it("shows the founder as lead, the rest as members, and the mentor's meeting frequency", async () => {
    const { result } = await renderStartup();

    await waitFor(() => expect(result.current.detail?.lead).not.toBeNull());
    expect(result.current.detail?.lead?.name).toBe("Ada Kaya");
    expect(result.current.detail?.members.names).toEqual(["Can Er"]);
    await waitFor(() =>
      expect(result.current.detail?.info).toContainEqual(
        expect.objectContaining({ value: "2 haftada 1" }),
      ),
    );
  });

  it("says the frequency is not set when the mentor has none", async () => {
    vi.mocked(getMentorProfile).mockResolvedValue({
      ...mentorProfile,
      meetingFrequency: null,
    });

    const { result } = await renderStartup();

    await waitFor(() =>
      expect(result.current.detail?.info).toContainEqual(
        expect.objectContaining({ value: "Belirtilmedi" }),
      ),
    );
  });

  it("has no detail and asks for no tasks without an accepted mentorship", async () => {
    vi.mocked(getMentorRequests).mockResolvedValue([pendingNewest]);

    const { result } = await renderStartup();

    expect(result.current.detail).toBeNull();
    expect(getActionItems).not.toHaveBeenCalled();
    expect(result.current.backHref).toBe(MOBILE_STARTUPS);
  });

  it("reports an error when the requests fail, and retries them", async () => {
    vi.mocked(getMentorRequests).mockRejectedValueOnce(new Error("offline"));

    const { result } = await renderStartup();

    expect(result.current.isError).toBe(true);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(getMentorRequests).toHaveBeenCalledTimes(2);
  });

  it("opens and closes the member list", async () => {
    const { result } = await renderStartup();
    expect(result.current.membersOpen).toBe(false);

    act(() => result.current.toggleMembers());
    expect(result.current.membersOpen).toBe(true);

    act(() => result.current.toggleMembers());
    expect(result.current.membersOpen).toBe(false);
  });
});
