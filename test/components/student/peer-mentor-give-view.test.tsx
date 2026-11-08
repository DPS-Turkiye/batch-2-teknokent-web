import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorGiveView } from "@/components/student/peer-mentor-give-view";
import {
  type BadgeAward,
  BadgeCode,
  BadgeKind,
  BadgeSource,
  BadgeStatus,
} from "@/interfaces/badges";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  type PeerMentoringRequest,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import { type AppSession, IdentityKind, UserRole } from "@/interfaces/session";
import { getMyBadges } from "@/lib/client/badges";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { getAvailabilitySettings } from "@/lib/client/mentor-profile";
import { decideMentorRequest } from "@/lib/client/mentor-requests";
import {
  getPeerMentorProfile,
  getReceivedPeerRequests,
} from "@/lib/client/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

let session: AppSession;
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
}));
vi.mock("@/lib/client/badges", () => ({
  getMyBadges: vi.fn(),
  getUserBadges: vi.fn(async () => []),
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentorProfile: vi.fn(),
  getReceivedPeerRequests: vi.fn(),
  savePeerMentorProfile: vi.fn(),
  getPeerMentors: vi.fn(),
  getPeerMentoringRequests: vi.fn(),
  createPeerMentoringRequest: vi.fn(),
}));
vi.mock("@/lib/client/mentor-requests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/mentor-requests")>()),
  decideMentorRequest: vi.fn(async () => ({})),
}));
vi.mock("@/lib/client/mentor-profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/mentor-profile")>()),
  getAvailabilitySettings: vi.fn(),
  updateAvailabilitySettings: vi.fn(),
}));

function student(permissions: UserRole[]): AppSession {
  return {
    userId: "zeynep",
    fullName: "Zeynep Demir",
    email: "zeynep.demir@odtu-dev.invalid",
    jobTitle: "",
    role: UserRole.Mentee,
    permissions,
    institutionKinds: [IdentityKind.Student],
  };
}

function gateAward(
  status: BadgeStatus,
  reason: string | null = null,
): BadgeAward {
  return {
    id: "award-1",
    code: BadgeCode.PeerMentor,
    kind: BadgeKind.Gate,
    programId: "program-1",
    programName: "İŞKUR Akran Mentörlüğü",
    status,
    source: BadgeSource.Coordinator,
    awardedAt: "2026-11-08T10:00:00Z",
    expiresAt: null,
    revokedAt: status === BadgeStatus.Revoked ? "2026-11-09T10:00:00Z" : null,
    reason,
  };
}

function received(
  id: string,
  status: MentorshipRequestStatus,
): PeerMentoringRequest {
  return {
    id,
    mentor: { userId: "zeynep", fullName: "Zeynep Demir", department: null },
    mentee: {
      userId: `student-${id}`,
      fullName: id === "r1" ? "Ayşe Yılmaz" : "Mehmet Kaya",
      department: "Bilgisayar Mühendisliği",
    },
    category: PeerTopicCategory.CareerInternship,
    message: "Staj başvurusu için CV'me bakar mısın?",
    status,
    createdAt: "2026-11-08T17:52:00Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  session = student([UserRole.Mentee, UserRole.Mentor]);
  vi.mocked(getMyBadges).mockResolvedValue([gateAward(BadgeStatus.Active)]);
  vi.mocked(fetchInstitutionRecord).mockResolvedValue({
    kinds: [IdentityKind.Student],
    fullName: "Zeynep Demir",
    email: null,
    faculty: null,
    departmentName: "Endüstri Mühendisliği",
    classYear: 4,
    programLevel: null,
    academicTitle: null,
    iskurParticipant: true,
    advisor: null,
    syncedAt: null,
  });
  vi.mocked(getPeerMentorProfile).mockResolvedValue(null);
  vi.mocked(getReceivedPeerRequests).mockResolvedValue([]);
  vi.mocked(getAvailabilitySettings).mockResolvedValue({
    rules: [],
    exceptions: [],
    menteeCapacity: 3,
    defaultMeetingDurationMinutes: 30,
    meetingBufferMinutes: 0,
  });
});

describe("PeerMentorGiveView", () => {
  it("tells an İŞKUR student without the badge how it is earned", async () => {
    session = student([UserRole.Mentee]);
    vi.mocked(getMyBadges).mockResolvedValue([]);
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(await screen.findByText("Rozet Yok")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Eğitimi başlat (yakında)" }),
    ).toBeDisabled();
  });

  // D4 seam: a revoked badge takes MENTOR away and closes the mentor side.
  it("explains a revoked badge with its reason and offers no mentor actions", async () => {
    session = student([UserRole.Mentee]);
    vi.mocked(getMyBadges).mockResolvedValue([
      gateAward(BadgeStatus.Revoked, "Görüşmelere katılmadı"),
    ]);
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(await screen.findByText("Rozetin geri alındı")).toBeVisible();
    expect(screen.getByText("Neden: Görüşmelere katılmadı")).toBeVisible();
    expect(getReceivedPeerRequests).not.toHaveBeenCalled();
  });

  it("invites a new badge holder to create their profile", async () => {
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(await screen.findByText("Rozet Kazanıldı")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Mentor profilini oluştur" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/profile");
  });

  it("asks for a fresh sign-in when the badge is newer than the session", async () => {
    session = student([UserRole.Mentee]);
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(
      await screen.findByText(/çıkış yapıp yeniden giriş yap/),
    ).toBeVisible();
    expect(getPeerMentorProfile).not.toHaveBeenCalled();
  });

  it("lets a published peer mentor accept and decline requests and lists their mentees", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
      menteeCapacity: 3,
    });
    vi.mocked(getReceivedPeerRequests).mockResolvedValue([
      received("r1", MentorshipRequestStatus.Pending),
      received("r2", MentorshipRequestStatus.Accepted),
    ]);
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorGiveView />);

    const waiting = await screen.findByRole("region", {
      name: "Gelen talepler",
    });
    expect(await within(waiting).findByText("Ayşe Yılmaz")).toBeVisible();
    const mentees = screen.getByRole("region", { name: "Mentee'lerim" });
    expect(within(mentees).getByText("Mehmet Kaya")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Müsaitlik ve kapasite" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Profili düzenle" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/profile");

    await user.click(within(waiting).getByRole("button", { name: "Kabul et" }));
    await waitFor(() =>
      expect(vi.mocked(decideMentorRequest).mock.calls[0]?.[0]).toEqual({
        id: "r1",
        status: MentorshipRequestStatus.Accepted,
        message: "Talebini kabul ettim, görüşmek üzere!",
      }),
    );
    expect(await screen.findByText("Talebi kabul ettin.")).toBeVisible();

    await user.click(
      within(waiting).getByRole("button", { name: "Uygun değil" }),
    );
    await waitFor(() =>
      expect(vi.mocked(decideMentorRequest).mock.calls[1]?.[0]).toMatchObject({
        id: "r1",
        status: MentorshipRequestStatus.Declined,
      }),
    );
  });
});
