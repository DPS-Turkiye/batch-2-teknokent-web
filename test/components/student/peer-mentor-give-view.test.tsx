import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorGiveView } from "@/components/student/peer-mentor-give-view";
import {
  BadgeCode,
  BadgeKind,
  BadgeSource,
  BadgeStatus,
  type BadgeAward,
} from "@/interfaces/badges";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerTopicCategory,
  type PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { TrainingState, type StudentTraining } from "@/interfaces/training";
import { ClientApiError } from "@/lib/client/api";
import { getMyBadges } from "@/lib/client/badges";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { getAvailabilitySettings } from "@/lib/client/mentor-profile";
import { decideMentorRequest } from "@/lib/client/mentor-requests";
import {
  getPeerMentorProfile,
  getReceivedPeerRequests,
} from "@/lib/client/peer-mentoring";
import { getStudentTraining } from "@/lib/client/training";
import { renderWithQueryClient } from "@test/test-utils";

let session: AppSession;
const refresh = vi.fn(async () => null);
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
  useSession: () => ({ session, refresh }),
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
vi.mock("@/lib/client/training", () => ({
  getStudentTraining: vi.fn(),
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

function training(state: TrainingState): StudentTraining {
  return {
    state,
    programId: "program-1",
    programName: "İŞKUR Gençlik Programı",
    version: 1,
    videoId: "video-1",
    videoWatched: state === TrainingState.Quiz,
    attemptsLeft: 3,
    nextAttemptAt: null,
    lastScore: null,
    passMark: 7,
    questionCount: 10,
  };
}

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
    acceptedAt:
      status === MentorshipRequestStatus.Accepted
        ? "2026-11-09T09:00:00Z"
        : null,
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
  vi.mocked(getStudentTraining).mockResolvedValue(
    training(TrainingState.NotAvailable),
  );
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
  it.each([TrainingState.Video, TrainingState.Quiz])(
    "links a student without the badge to the training while it is takeable (%s)",
    async (state) => {
      session = student([UserRole.Mentee]);
      vi.mocked(getMyBadges).mockResolvedValue([]);
      vi.mocked(getStudentTraining).mockResolvedValue(training(state));
      renderWithQueryClient(<PeerMentorGiveView />);

      expect(
        await screen.findByRole("heading", {
          name: "Mentor olmak için eğitimi tamamla",
        }),
      ).toBeVisible();
      expect(
        await screen.findByRole("link", { name: "Eğitime Git" }),
      ).toHaveAttribute("href", "/student/peer-mentoring/training");
      const steps = screen.getByRole("list");
      expect(
        within(steps).getByText("Rozetini Al").closest("li"),
      ).toHaveAttribute("aria-current", "step");
      expect(screen.getByText("Tek hesap")).toBeVisible();
    },
  );

  it.each([
    [
      "the program has no published training",
      () => Promise.resolve(training(TrainingState.NotAvailable)),
      "Programının eğitimi henüz yayında değil.",
    ],
    [
      "the training endpoint is absent",
      () => Promise.reject(new ClientApiError("Not found", 404)),
      "Eğitim şu an açılamıyor.",
    ],
  ])(
    "keeps the training button disabled with a reason when %s",
    async (_case, answer, reason) => {
      session = student([UserRole.Mentee]);
      vi.mocked(getMyBadges).mockResolvedValue([]);
      vi.mocked(getStudentTraining).mockImplementation(answer);
      renderWithQueryClient(<PeerMentorGiveView />);

      expect(await screen.findByText(reason)).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Eğitime Git" }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("link", { name: "Eğitime Git" }),
      ).not.toBeInTheDocument();
    },
  );

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

    expect(await screen.findByText("Rozetin doğrulandı")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Mentor profilini oluştur" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/profile");
    expect(
      within(screen.getByRole("list"))
        .getByText("Mentor Profilini Oluştur")
        .closest("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("re-reads the session once when the badge is newer than it, and asks for a sign-in only if that can't help", async () => {
    session = student([UserRole.Mentee]);
    refresh.mockClear();
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(
      await screen.findByText(/çıkış yapıp yeniden giriş yap/),
    ).toBeVisible();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getPeerMentorProfile).not.toHaveBeenCalled();
  });

  it("leaves the session alone when it already carries the badge's permission", async () => {
    session = student([UserRole.Mentee, UserRole.Mentor]);
    refresh.mockClear();
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(await screen.findByText("Rozetin doğrulandı")).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
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
      levels: {},
      experiences: [],
    });
    vi.mocked(getReceivedPeerRequests).mockResolvedValue([
      received("r1", MentorshipRequestStatus.Pending),
      received("r2", MentorshipRequestStatus.Accepted),
    ]);
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorGiveView />);

    const panel = await screen.findByRole("tabpanel", {
      name: /Mentorluk Talepleri/,
    });
    const card = await within(panel).findByRole("article", {
      name: "Ayşe Yılmaz",
    });
    expect(within(card).getByText("Onay Bekliyor")).toBeVisible();
    expect(within(card).getByText("Kariyer ve Staj")).toBeVisible();
    expect(
      screen.getByRole("tab", { name: /Mentorluk Talepleri/ }),
    ).toHaveTextContent("1");
    const capacity = screen.getByRole("region", { name: "Kapasiten" });
    expect(within(capacity).getByText("/ 3 mentee")).toBeVisible();
    expect(within(capacity).getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "1 / 3 mentee",
    );
    expect(
      screen.getByRole("link", { name: "Profili Düzenle" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/profile");

    expect(
      within(card)
        .getByRole("button", { name: "Kabul Et" })
        .closest("[data-tour]"),
    ).toHaveAttribute("data-tour", "peer-request-accept");
    await user.click(within(card).getByRole("button", { name: "Kabul Et" }));
    await waitFor(() =>
      expect(vi.mocked(decideMentorRequest).mock.calls[0]?.[0]).toEqual({
        id: "r1",
        status: MentorshipRequestStatus.Accepted,
        message: "Talebini kabul ettim, görüşmek üzere!",
      }),
    );
    expect(await screen.findByText("Talebi kabul ettin.")).toBeVisible();

    await user.click(within(card).getByRole("button", { name: "Reddet" }));
    await waitFor(() =>
      expect(vi.mocked(decideMentorRequest).mock.calls[1]?.[0]).toMatchObject({
        id: "r1",
        status: MentorshipRequestStatus.Declined,
      }),
    );

    screen.getByRole("tab", { name: /Mentorluk Talepleri/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Menteelerim/ })).toHaveFocus();
    const mentees = screen.getByRole("tabpanel", { name: /Menteelerim/ });
    expect(
      within(mentees).getByRole("article", { name: "Mehmet Kaya" }),
    ).toBeVisible();
    expect(within(mentees).getByText("Kabul edildi")).toBeVisible();
    expect(
      within(mentees).queryByRole("button", { name: "Kabul Et" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{End}");
    expect(
      screen.getByRole("tab", { name: "Mentor Profilim" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByText("Staj ve CV konusunda yardımcı olurum."),
    ).toBeVisible();
  });

  it("reads the capacity from the saved availability settings, so the card follows a save", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: null,
      classYear: null,
      menteeCapacity: 3,
      levels: {},
      experiences: [],
    });
    vi.mocked(getAvailabilitySettings).mockResolvedValue({
      rules: [],
      exceptions: [],
      menteeCapacity: 5,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
    });
    renderWithQueryClient(<PeerMentorGiveView />);

    const capacity = await screen.findByRole("region", { name: "Kapasiten" });
    expect(await within(capacity).findByText("/ 5 mentee")).toBeVisible();
  });

  it("tells the mentor on the Menteelerim tab too when the requests can't be read", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: null,
      classYear: null,
      menteeCapacity: 3,
      levels: {},
      experiences: [],
    });
    vi.mocked(getReceivedPeerRequests).mockRejectedValue(
      new ClientApiError("Talepler okunamadı.", 500),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorGiveView />);

    await user.click(await screen.findByRole("tab", { name: /Menteelerim/ }));
    const mentees = screen.getByRole("tabpanel", { name: /Menteelerim/ });
    expect(
      await within(mentees).findByText(/Talepler okunamadı/),
    ).toBeVisible();
  });

  it("says when there is nothing to answer yet", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: null,
      classYear: null,
      menteeCapacity: null,
      levels: {},
      experiences: [],
    });
    vi.mocked(getAvailabilitySettings).mockResolvedValue({
      rules: [],
      exceptions: [],
      menteeCapacity: null,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
    });
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(await screen.findByText("Yanıt bekleyen talep yok.")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByText(/Kapasite belirlemedin/)).toBeVisible(),
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText(/Kapasite belirlemedin/)).toBeVisible();
  });
});
