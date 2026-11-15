import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  type PeerMentorProfile,
} from "@/interfaces/peer-mentoring";
import { PeerReportStatus } from "@/interfaces/peer-reports";
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
import {
  getPeerDailyReport,
  getPeerReportMeetings,
  getPeerReportWeek,
  getPeerWeeklyReport,
} from "@/lib/client/peer-reports";
import { getStudentTraining } from "@/lib/client/training";
import { peerDailyReportFixture } from "@test/fixtures/peer-reports";
import { weeklyReport } from "@test/fixtures/peer-weekly-report";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/student/peer-mentoring",
  useSearchParams: () => search,
}));
vi.mock("@/lib/client/peer-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/peer-reports")>()),
  getPeerReportMeetings: vi.fn(),
  getPeerWeeklyReport: vi.fn(),
  getPeerReportWeek: vi.fn(),
  getPeerDailyReport: vi.fn(),
}));

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

function publishedProfile(): PeerMentorProfile {
  return {
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
  };
}

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  freezeDate("2026-11-12T13:00:00Z");
  search = new URLSearchParams();
  vi.mocked(getPeerReportMeetings).mockResolvedValue([]);
  vi.mocked(getPeerWeeklyReport).mockResolvedValue(weeklyReport());
  vi.mocked(getPeerDailyReport).mockResolvedValue(peerDailyReportFixture());
  vi.mocked(getPeerReportWeek).mockResolvedValue({
    weekStart: "2026-11-09",
    days: [],
    dailySent: 0,
  });
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

  it("opens on Menteelerim: answers the waiting requests and lists the active mentees", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    vi.mocked(getReceivedPeerRequests).mockResolvedValue([
      received("r1", MentorshipRequestStatus.Pending),
      received("r2", MentorshipRequestStatus.Accepted),
    ]);
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorGiveView />);

    const panel = await screen.findByRole("tabpanel", {
      name: /Menteelerim/,
    });
    const card = await within(panel).findByRole("article", {
      name: "Ayşe Yılmaz",
    });
    expect(within(card).getByText("Onay Bekliyor")).toBeVisible();
    expect(within(card).getByText("Kariyer ve Staj")).toBeVisible();
    expect(screen.getByRole("tab", { name: /Menteelerim/ })).toHaveTextContent(
      "1",
    );
    const active = within(panel).getByRole("region", {
      name: /Aktif menteelerim/,
    });
    expect(
      within(active).getByRole("article", { name: "Mehmet Kaya" }),
    ).toBeVisible();
    expect(within(active).getByText("Kabul edildi")).toBeVisible();
    expect(
      within(active).queryByRole("button", { name: "Kabul Et" }),
    ).not.toBeInTheDocument();
    const capacity = screen.getByRole("region", { name: "Kapasiten" });
    expect(within(capacity).getByText("/ 3 mentee")).toBeVisible();
    expect(within(capacity).getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "1 / 3 mentee",
    );

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
  });

  it("keeps the open tab in the URL, so report links land on Faaliyet Raporum", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    search = new URLSearchParams("as=MENTOR");
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorGiveView />);

    const mentees = await screen.findByRole("tab", { name: /Menteelerim/ });
    expect(mentees).toHaveAttribute("aria-selected", "true");
    mentees.focus();
    await user.keyboard("{ArrowRight}");
    expect(replace).toHaveBeenLastCalledWith(
      "/student/peer-mentoring?as=MENTOR&tab=report",
      { scroll: false },
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Kapasite ve müsaitliği düzenle",
      }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      "/student/peer-mentoring?as=MENTOR&tab=profile",
      { scroll: false },
    );
  });

  it("shows the activity report on tab=report", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    search = new URLSearchParams("as=MENTOR&tab=report");
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(
      await screen.findByRole("tab", { name: "Faaliyet Raporum" }),
    ).toHaveAttribute("aria-selected", "true");
    const report = screen.getByRole("tabpanel", { name: "Faaliyet Raporum" });
    expect(
      await within(report).findByRole("button", { name: "Haftalık Özet" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("tabpanel", { name: /Menteelerim/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the profile and availability on tab=profile, and falls back to Menteelerim for an unknown tab", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    search = new URLSearchParams("tab=profile");
    const { unmount } = renderWithQueryClient(<PeerMentorGiveView />);

    expect(
      await screen.findByText("Staj ve CV konusunda yardımcı olurum."),
    ).toBeVisible();
    for (const link of screen.getAllByRole("link", {
      name: "Profili Düzenle",
    })) {
      expect(link).toHaveAttribute("href", "/student/peer-mentoring/profile");
    }
    expect(
      screen.queryByRole("region", { name: "Kapasiten" }),
    ).not.toBeInTheDocument();
    unmount();

    search = new URLSearchParams("tab=requests");
    renderWithQueryClient(<PeerMentorGiveView />);
    expect(
      await screen.findByRole("tab", { name: /Menteelerim/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("disables Kabul Et once the capacity is full", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    vi.mocked(getAvailabilitySettings).mockResolvedValue({
      rules: [],
      exceptions: [],
      menteeCapacity: 1,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
    });
    vi.mocked(getReceivedPeerRequests).mockResolvedValue([
      received("r1", MentorshipRequestStatus.Pending),
      received("r2", MentorshipRequestStatus.Accepted),
    ]);
    renderWithQueryClient(<PeerMentorGiveView />);

    const card = await screen.findByRole("article", { name: "Ayşe Yılmaz" });
    await waitFor(() =>
      expect(
        within(card).getByRole("button", { name: "Kabul Et" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByText(/Kapasiten dolu; yeni talep kabul etmek için/),
    ).toBeVisible();
    expect(within(card).getByRole("button", { name: "Reddet" })).toBeEnabled();
  });

  it("asks for the latest held meeting's report and shows this week's report", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    const [meeting] = peerDailyReportFixture().meetings;
    if (!meeting) throw new Error("fixture meeting missing");
    vi.mocked(getPeerReportMeetings).mockResolvedValue([
      {
        ...meeting,
        meetingId: "m-sent",
        menteeName: "Emre Kaya",
        reportStatus: PeerReportStatus.InReview,
      },
      {
        ...meeting,
        meetingId: "m-due",
        menteeName: "Ayşe Yıldız",
        reportStatus: null,
      },
    ]);
    renderWithQueryClient(<PeerMentorGiveView />);

    const banner = await screen.findByRole("region", {
      name: /Ayşe Yıldız ile görüşmen tamamlandı/,
    });
    expect(
      within(banner).getByRole("link", { name: "Görüşme Raporunu Doldur" }),
    ).toHaveAttribute("href", "/student/peer-mentoring/reports/meetings/m-due");
    expect(getPeerReportMeetings).toHaveBeenCalledWith(
      "2026-11-06",
      "2026-11-12",
    );

    const week = await screen.findByRole("region", {
      name: "Bu haftanın raporu",
    });
    expect(getPeerWeeklyReport).toHaveBeenCalledWith("2026-11-09");
    expect(within(week).getByText("Taslak")).toBeVisible();
    expect(
      within(week).getByText("11 faaliyet otomatik eklendi"),
    ).toBeVisible();
    expect(
      within(week).getByText("Haftalık değerlendirmen bekleniyor"),
    ).toBeVisible();
    expect(within(week).getByText("Teslim: 16 Kasım, 23:59")).toBeVisible();
    expect(
      within(week).getByRole("link", { name: "Raporu Tamamla" }),
    ).toHaveAttribute(
      "href",
      "/student/peer-mentoring?as=MENTOR&tab=report&view=weekly&week=2026-11-09",
    );
  });

  it("says so when the report cards can't be read, instead of hiding them", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    vi.mocked(getPeerReportMeetings).mockRejectedValue(
      new ClientApiError("Görüşmeler okunamadı.", 500),
    );
    renderWithQueryClient(<PeerMentorGiveView />);

    const mentees = await screen.findByRole("tabpanel", {
      name: /Menteelerim/,
    });
    expect(
      await within(mentees).findByText(/Görüşmeler okunamadı/),
    ).toBeVisible();
  });

  it("drops the evaluation line once the week is sent", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    vi.mocked(getPeerWeeklyReport).mockResolvedValue(
      weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
    );
    renderWithQueryClient(<PeerMentorGiveView />);

    const week = await screen.findByRole("region", {
      name: "Bu haftanın raporu",
    });
    expect(
      within(week).getByText("11 faaliyet otomatik eklendi"),
    ).toBeVisible();
    expect(
      within(week).queryByText("Haftalık değerlendirmen bekleniyor"),
    ).not.toBeInTheDocument();
  });

  it("shows no banner when every held meeting has its report", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue(publishedProfile());
    renderWithQueryClient(<PeerMentorGiveView />);

    expect(
      await screen.findByRole("region", { name: "Bu haftanın raporu" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Görüşme Raporunu Doldur" }),
    ).not.toBeInTheDocument();
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

  it("tells the mentor on Menteelerim when the requests can't be read", async () => {
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
    renderWithQueryClient(<PeerMentorGiveView />);

    const mentees = await screen.findByRole("tabpanel", {
      name: /Menteelerim/,
    });
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
