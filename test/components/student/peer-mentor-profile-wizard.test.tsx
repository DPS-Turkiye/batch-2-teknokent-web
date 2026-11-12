import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorProfileWizard } from "@/components/student/peer-mentor-profile-wizard";
import {
  PeerExperienceKind,
  PeerTopicCategory,
  PeerTopicLevel,
} from "@/interfaces/peer-mentoring";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { updateAvailabilitySettings } from "@/lib/client/mentor-profile";
import {
  deletePeerMentorDraft,
  getPeerMentorDraft,
  getPeerMentorProfile,
  savePeerMentorDraft,
  savePeerMentorProfile,
} from "@/lib/client/peer-mentoring";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const session: AppSession = {
  userId: "zeynep",
  fullName: "Zeynep Demir",
  email: "zeynep.demir@odtu-dev.invalid",
  jobTitle: "",
  role: UserRole.Mentee,
  permissions: [UserRole.Mentee, UserRole.Mentor],
  institutionKinds: [IdentityKind.Student],
};
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
  useSession: () => ({ session, refresh: vi.fn(async () => null) }),
}));
vi.mock("@/lib/client/badges", () => ({
  getMyBadges: vi.fn(async () => []),
  getUserBadges: vi.fn(async () => []),
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getProfileCompletionCategories: vi.fn(async () =>
    structuredClone(PROFILE_COMPLETION_CATEGORIES),
  ),
  getPeerMentorCategories: vi.fn(async () =>
    structuredClone(PROFILE_COMPLETION_CATEGORIES),
  ),
  getStudentProfileCompletion: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
}));
vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerMentorProfile: vi.fn(),
  savePeerMentorProfile: vi.fn(),
  getPeerMentorDraft: vi.fn(),
  savePeerMentorDraft: vi.fn(),
  deletePeerMentorDraft: vi.fn(async () => undefined),
  getReceivedPeerRequests: vi.fn(),
  getPeerMentors: vi.fn(),
  getPeerMentoringRequests: vi.fn(),
  createPeerMentoringRequest: vi.fn(),
}));
vi.mock("@/lib/client/mentor-profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/mentor-profile")>()),
  getAvailabilitySettings: vi.fn(),
  updateAvailabilitySettings: vi.fn(async () => ({})),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPeerMentorProfile).mockResolvedValue(null);
  vi.mocked(getPeerMentorDraft).mockResolvedValue(null);
  vi.mocked(savePeerMentorDraft).mockImplementation(async (draft) => ({
    draft,
    updatedAt: "2026-11-12T11:05:00Z",
  }));
  vi.mocked(savePeerMentorProfile).mockImplementation(async (input) => ({
    ...input,
    erasmus: input.erasmus || null,
    linkedinUrl: input.linkedinUrl || null,
    department: "Endüstri Mühendisliği",
    classYear: 4,
    menteeCapacity: 3,
  }));
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
});

describe("PeerMentorProfileWizard", () => {
  it("walks a new peer mentor through every step and publishes the profile and hours together", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorProfileWizard />);
    const next = () =>
      user.click(screen.getByRole("button", { name: "Devam Et" }));

    expect(
      await screen.findByRole("heading", {
        name: "Hangi konularda mentorluk verebilirsin?",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: "Mentor profilini oluştur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mentorluk kategorileri").closest("li"),
    ).toHaveAttribute("aria-current", "step");
    expect(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    ).toBeEnabled();
    await screen.findByRole("checkbox", { name: "Kariyer ve Staj" });
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "En az bir kategori seç.",
    );

    await user.click(screen.getByRole("checkbox", { name: "Kariyer ve Staj" }));
    await next();
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: CV hazırlama" }),
    );
    expect(screen.getByText("1 alt konu seçildi")).toBeVisible();
    const level = screen.getByRole("group", {
      name: "Deneyim düzeyin, Kariyer ve Staj",
    });
    await user.click(within(level).getByRole("radio", { name: "İleri" }));
    expect(within(level).getByRole("radio", { name: "İleri" })).toBeChecked();
    await next();

    await user.type(
      screen.getByLabelText(/Güçlü olduğun dersler/),
      "IE 251{enter}IE 265",
    );
    await user.click(screen.getByRole("button", { name: "Deneyim ekle" }));
    const form = screen.getByRole("region", { name: "Yeni deneyim" });
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Deneyim başlığını yaz.",
    );
    await next();
    expect(
      screen.getByText("Açık deneyimi önce kaydet ya da vazgeç."),
    ).toBeVisible();
    await user.type(
      within(form).getByLabelText("Deneyim başlığı"),
      "Yaz stajyeri",
    );
    await user.type(
      within(form).getByLabelText("Kurum / kuruluş"),
      "ABC Lojistik",
    );
    fireEvent.change(within(form).getByLabelText("Başlangıç"), {
      target: { value: "2025-07" },
    });
    fireEvent.change(within(form).getByLabelText(/^Bitiş/), {
      target: { value: "2025-06" },
    });
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Bitiş, başlangıçtan önce olamaz.",
    );
    fireEvent.change(within(form).getByLabelText(/^Bitiş/), {
      target: { value: "2025-08" },
    });
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    expect(screen.queryByRole("region", { name: "Yeni deneyim" })).toBeNull();
    expect(screen.getByText("Yaz stajyeri — ABC Lojistik")).toBeVisible();
    expect(screen.getByText("Temmuz 2025 – Ağustos 2025")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Başka deneyim ekle" }),
    ).toBeVisible();
    await next();

    await user.type(screen.getByLabelText(/Açıklaman/), "Kısa");
    expect(screen.getByText("En az 20 karakter · 4 / 2000")).toBeVisible();
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent("en az 20 karakter");
    await user.type(
      screen.getByLabelText(/Açıklaman/),
      " değil: staj başvurusu ve CV hazırlığı.",
    );
    await next();

    await user.type(
      screen.getByLabelText("LinkedIn"),
      "linkedin.com/in/zeynep",
    );
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "http:// veya https://",
    );
    await user.clear(screen.getByLabelText("LinkedIn"));
    await user.type(
      screen.getByLabelText("LinkedIn"),
      "https://linkedin.com/in/zeynep",
    );
    await next();

    expect(screen.getByText("HAFTALIK UYGUNLUK")).toBeVisible();
    expect(screen.queryByText("UYGUN OLMADIĞIN TARİHLER")).toBeNull();
    await user.click(screen.getByRole("switch", { name: "Salı uygun" }));
    await next();

    expect(
      await screen.findByRole("heading", {
        name: "Profilin öğrencilere böyle görünecek",
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Zeynep Demir" })).toBeVisible();
    expect(
      screen.getByText("Kısa değil: staj başvurusu ve CV hazırlığı."),
    ).toBeVisible();
    expect(screen.getByText(/^Salı \d{2}:\d{2} – \d{2}:\d{2}$/)).toBeVisible();
    expect(screen.getByText("Aynı anda 3 mentee")).toBeVisible();
    expect(screen.getByText("Yaz stajyeri — ABC Lojistik")).toBeVisible();
    expect(screen.getByText("https://linkedin.com/in/zeynep")).toBeVisible();
    expect(savePeerMentorProfile).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Profili Yayınla" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/student/peer-mentoring?as=MENTOR"),
    );
    expect(vi.mocked(savePeerMentorProfile).mock.calls[0]?.[0]).toEqual({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: ["fixture-cv"],
      strongCourses: ["IE 251", "IE 265"],
      projects: [],
      erasmus: "",
      helpWith: "Kısa değil: staj başvurusu ve CV hazırlığı.",
      linkedinUrl: "https://linkedin.com/in/zeynep",
      levels: { [PeerTopicCategory.CareerInternship]: PeerTopicLevel.Advanced },
      experiences: [
        {
          kind: PeerExperienceKind.Other,
          title: "Yaz stajyeri",
          organization: "ABC Lojistik",
          startedOn: "2025-07",
          endedOn: "2025-08",
          summary: null,
        },
      ],
    });
    expect(
      vi.mocked(updateAvailabilitySettings).mock.calls[0]?.[0],
    ).toMatchObject({
      menteeCapacity: 3,
      defaultMeetingDurationMinutes: 30,
      rules: [expect.objectContaining({ dayOfWeek: "TUESDAY" })],
    });
  });

  it("opens the saved level and cards when editing, edits one card at a time and removes one", async () => {
    const user = userEvent.setup();
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj başvurusu ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
      menteeCapacity: 3,
      levels: {
        [PeerTopicCategory.CareerInternship]: PeerTopicLevel.Intermediate,
      },
      experiences: [
        {
          kind: PeerExperienceKind.Internship,
          title: "Yaz stajyeri",
          organization: "ABC Lojistik",
          startedOn: "2025-07",
          endedOn: "2025-08",
          summary: null,
        },
        {
          kind: PeerExperienceKind.Club,
          title: "Kulüp başkanı",
          organization: "IEEE ODTÜ",
          startedOn: "2024-09",
          endedOn: null,
          summary: null,
        },
      ],
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);
    const next = () =>
      user.click(screen.getByRole("button", { name: "Devam Et" }));
    await screen.findByRole("group", { name: "Mentor profilini düzenle" });
    await next();

    expect(screen.getByRole("radio", { name: "Orta" })).toBeChecked();
    await next();

    expect(screen.getByText("Eylül 2024 – Devam ediyor")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Düzenle, Kulüp başkanı" }),
    );
    const form = screen.getByRole("region", { name: "Deneyimi düzenle" });
    const title = within(form).getByLabelText("Deneyim başlığı");
    expect(title).toHaveValue("Kulüp başkanı");
    expect(title).toHaveFocus();
    // One card at a time: the list's buttons wait while a card is open.
    expect(
      screen.getByRole("button", { name: "Kaldır, Yaz stajyeri" }),
    ).toBeDisabled();
    await user.clear(title);
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Deneyim başlığını yaz.");
    await user.type(title, "Kulüp eş başkanı");
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Kaldır, Yaz stajyeri" }),
    );

    expect(screen.queryByText(/Yaz stajyeri/)).toBeNull();
    expect(screen.getByText("Kulüp eş başkanı — IEEE ODTÜ")).toBeVisible();
  });

  it("saves the answers so far as a draft with the step to reopen on, and says when", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorProfileWizard />);
    await user.click(
      await screen.findByRole("checkbox", { name: "Kariyer ve Staj" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam Et" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: CV hazırlama" }),
    );

    await user.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );

    await waitFor(() =>
      expect(vi.mocked(savePeerMentorDraft).mock.calls[0]?.[0]).toEqual({
        step: "subtopics",
        categories: [PeerTopicCategory.CareerInternship],
        subTopics: ["fixture-cv"],
        strongCourses: [],
        projects: [],
        erasmus: "",
        helpWith: "",
        linkedinUrl: "",
        levels: {},
        experiences: [],
      }),
    );
    expect(
      await screen.findByText(/^Taslak kaydedildi · \d{2}:\d{2}$/),
    ).toBeVisible();
    expect(savePeerMentorProfile).not.toHaveBeenCalled();
  });

  it("shows a draft load failure before allowing edits", async () => {
    vi.mocked(getPeerMentorDraft).mockRejectedValue(
      new Error("Draft unavailable"),
    );
    renderWithQueryClient(<PeerMentorProfileWizard />);
    expect(await screen.findByText("Draft unavailable")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Taslak olarak kaydet" }),
    ).toBeNull();
  });

  it("keeps navigation disabled until a draft save finishes", async () => {
    vi.mocked(savePeerMentorDraft).mockImplementation(
      () => new Promise(() => {}),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<PeerMentorProfileWizard />);
    await user.click(
      await screen.findByRole("checkbox", { name: "Kariyer ve Staj" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );
    expect(screen.getByRole("button", { name: "Devam Et" })).toBeDisabled();
  });

  it("reopens a saved draft on its step with its answers, and can delete it", async () => {
    const user = userEvent.setup();
    vi.mocked(getPeerMentorDraft).mockResolvedValue({
      draft: {
        step: "experience",
        categories: [PeerTopicCategory.CareerInternship],
        subTopics: ["fixture-cv"],
        strongCourses: ["IE 251"],
        projects: null,
        erasmus: null,
        helpWith: "Yarım kalan",
        linkedinUrl: null,
        levels: { [PeerTopicCategory.CareerInternship]: PeerTopicLevel.Basic },
        experiences: [
          {
            kind: PeerExperienceKind.Internship,
            title: "Yaz stajyeri",
            organization: "ABC Lojistik",
            startedOn: "2025-07",
            endedOn: null,
            summary: null,
          },
          // A card without a title is not brought back as a card.
          {
            kind: null,
            title: null,
            organization: "Yarım",
            startedOn: null,
            endedOn: null,
            summary: null,
          },
          // An older card without a start month comes back, asking for one.
          {
            kind: null,
            title: "Asistan",
            organization: null,
            startedOn: null,
            endedOn: null,
            summary: null,
          },
        ],
      },
      updatedAt: "2026-11-12T08:05:00Z",
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);

    expect(
      await screen.findByText("Yaz stajyeri — ABC Lojistik"),
    ).toBeVisible();
    expect(screen.queryByText(/Yarım/)).toBeNull();
    expect(screen.getByText("Asistan")).toBeVisible();
    expect(
      screen.getByText("Başlangıç ayı eksik: eklemek için düzenle."),
    ).toBeVisible();
    expect(screen.getByLabelText(/Güçlü olduğun dersler/)).toHaveValue(
      "IE 251",
    );
    expect(screen.getByText(/^Taslak kaydedildi · /)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Taslağı sil" }));

    await waitFor(() => expect(deletePeerMentorDraft).toHaveBeenCalled());
    expect(
      await screen.findByRole("checkbox", { name: "Kariyer ve Staj" }),
    ).not.toBeChecked();
    expect(screen.queryByText(/^Taslak kaydedildi/)).toBeNull();
  });

  it("brings a new mentor's draft saved on the preview back to the hours, which a draft does not keep", async () => {
    vi.mocked(getPeerMentorDraft).mockResolvedValue({
      draft: {
        step: "preview",
        categories: [PeerTopicCategory.CareerInternship],
        subTopics: null,
        strongCourses: null,
        projects: null,
        erasmus: null,
        helpWith: "Staj başvurusu ve CV konusunda yardımcı olurum.",
        linkedinUrl: null,
        levels: null,
        experiences: null,
      },
      updatedAt: "2026-11-12T08:05:00Z",
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);

    await waitFor(() =>
      expect(
        screen.getByText("Müsaitlik ve kapasite").closest("li"),
      ).toHaveAttribute("aria-current", "step"),
    );
    expect(screen.getByText("Önizle").closest("li")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("asks for a start month on an older card before moving on, since the backend needs one to publish", async () => {
    const user = userEvent.setup();
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.CareerInternship],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: null,
      helpWith: "Staj başvurusu ve CV konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
      menteeCapacity: 3,
      levels: {},
      experiences: [
        {
          kind: PeerExperienceKind.Job,
          title: "Asistan",
          organization: "ODTÜ",
          startedOn: null,
          endedOn: null,
          summary: null,
        },
      ],
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);
    const next = () =>
      user.click(screen.getByRole("button", { name: "Devam Et" }));
    await screen.findByRole("group", { name: "Mentor profilini düzenle" });
    await next();
    await next();

    expect(
      screen.getByText("Başlangıç ayı eksik: eklemek için düzenle."),
    ).toBeVisible();
    await next();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Başlangıç ayı eksik deneyimleri düzenle.",
    );

    await user.click(screen.getByRole("button", { name: "Düzenle, Asistan" }));
    const form = screen.getByRole("region", { name: "Deneyimi düzenle" });
    fireEvent.change(within(form).getByLabelText("Başlangıç"), {
      target: { value: "2023-02" },
    });
    await user.click(
      within(form).getByRole("button", { name: "Deneyimi Kaydet" }),
    );
    expect(screen.getByText("Şubat 2023 – Devam ediyor")).toBeVisible();
    await next();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("opens with the published answers when editing", async () => {
    vi.mocked(getPeerMentorProfile).mockResolvedValue({
      categories: [PeerTopicCategory.International],
      subTopics: [],
      strongCourses: [],
      projects: [],
      erasmus: "TU Delft",
      helpWith: "Erasmus başvurusu konusunda yardımcı olurum.",
      linkedinUrl: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
      menteeCapacity: 3,
      levels: {},
      experiences: [],
    });
    renderWithQueryClient(<PeerMentorProfileWizard />);

    expect(
      await screen.findByRole("group", { name: "Mentor profilini düzenle" }),
    ).toBeInTheDocument();
    // Geri on the first step leaves the wizard for Mentorluk Ver.
    expect(screen.getByRole("link", { name: "Geri" })).toHaveAttribute(
      "href",
      "/student/peer-mentoring?as=MENTOR",
    );
    expect(
      screen.getByRole("checkbox", { name: "Uluslararası Fırsatlar" }),
    ).toBeChecked();
  });
});
