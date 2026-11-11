import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentProfileView } from "@/components/student/student-profile-view";
import { StudyLevel, type InstitutionRecord } from "@/interfaces/institution";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { IdentityKind } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import {
  EMPTY_PROFILE_COMPLETION,
  PROFILE_COMPLETION_CATEGORIES,
} from "@/lib/client/fixtures/student-profile-completion";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import {
  getProfileCompletionCategories,
  getStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/badges", async () => {
  const { BadgeCode, BadgeKind, BadgeSource, BadgeStatus } =
    await import("@/interfaces/badges");
  return {
    getMyAchievements: vi.fn(async () => []),
    getMyBadges: vi.fn(async () => [
      {
        id: "award-1",
        code: BadgeCode.PeerMentor,
        kind: BadgeKind.Gate,
        programId: "program-1",
        programName: "İŞKUR Akran Mentörlüğü",
        status: BadgeStatus.Active,
        source: BadgeSource.Coordinator,
        awardedAt: "2026-11-08T10:00:00Z",
        expiresAt: null,
        revokedAt: null,
        reason: null,
      },
    ]),
    getUserBadges: vi.fn(async () => []),
  };
});
const upload = vi.fn();
vi.mock("@/hooks/use-profile-photo", () => ({
  useProfilePhoto: () => ({ photoUrl: null, isUploading: false, upload }),
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
  getProfileCompletionCategories: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
}));
const RECORD: InstitutionRecord = {
  kinds: [IdentityKind.Student],
  fullName: "Ayşe Yılmaz",
  email: "ayse.yilmaz@odtu-dev.invalid",
  faculty: "Mühendislik Fakültesi",
  departmentName: "Bilgisayar Mühendisliği",
  classYear: 3,
  programLevel: StudyLevel.Bachelor,
  academicTitle: null,
  iskurParticipant: false,
  advisor: {
    userId: null,
    fullName: "Ahmet Öztürk",
    academicTitle: "Dr. Öğr. Üyesi",
  },
  syncedAt: "2026-11-08T09:00:00Z",
};

beforeEach(() => {
  vi.mocked(fetchInstitutionRecord).mockReset().mockResolvedValue(RECORD);
  vi.mocked(getStudentProfileCompletion)
    .mockReset()
    .mockResolvedValue({
      ...structuredClone(EMPTY_PROFILE_COMPLETION),
      topics: [PeerTopicCategory.CareerInternship],
      subtopics: ["fixture-cv"],
      goal: "Yaz stajı bulmak",
      completed: true,
    });
  vi.mocked(getProfileCompletionCategories)
    .mockReset()
    .mockResolvedValue(PROFILE_COMPLETION_CATEGORIES);
  vi.mocked(saveStudentProfileCompletion)
    .mockReset()
    .mockImplementation(async (data) => data);
});

function region(name: string) {
  return screen.getByRole("region", { name });
}

describe("StudentProfileView › Kurumsal bilgiler", () => {
  it("shows the ODTÜ record read-only", async () => {
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal bilgiler");

    expect(
      await within(institution).findByText("Bilgisayar Mühendisliği"),
    ).toBeVisible();
    expect(
      within(institution).getByText("ayse.yilmaz@odtu-dev.invalid"),
    ).toBeVisible();
    expect(within(institution).getByText("3. sınıf · Lisans")).toBeVisible();
    expect(within(institution).getByText("Düzenlenemez")).toBeVisible();
    expect(within(institution).queryByRole("textbox")).toBeNull();
    expect(within(institution).queryByRole("button")).toBeNull();
  });

  it("says Bilinmiyor for a field ODTÜ did not send", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue({
      ...RECORD,
      email: null,
      classYear: null,
      programLevel: null,
    });
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal bilgiler");
    expect(await within(institution).findAllByText("Bilinmiyor")).toHaveLength(
      2,
    );
  });

  it("treats a 404 as an account without ODTÜ details, not as an error", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Bulunamadı", 404),
    );
    renderWithQueryClient(<StudentProfileView />);

    expect(
      await screen.findByText(
        "Kurumsal kayıt bulunamadı",
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(within(region("Kurumsal bilgiler")).queryByRole("alert")).toBeNull();
  });

  it("offers a retry when the record fails to load", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 500),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal bilgiler");

    expect(
      await within(institution).findByText(
        "Kurumsal bilgiler yüklenemedi.",
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
    vi.mocked(fetchInstitutionRecord).mockResolvedValue(RECORD);
    await user.click(
      within(institution).getByRole("button", { name: "Tekrar dene" }),
    );
    expect(
      await within(institution).findByText("Bilgisayar Mühendisliği"),
    ).toBeVisible();
  });
});

describe("StudentProfileView › side cards", () => {
  it("shows the advisor from the record", async () => {
    renderWithQueryClient(<StudentProfileView />);
    const advisor = await screen.findByRole("region", {
      name: "Dr. Öğr. Üyesi Ahmet Öztürk",
    });
    expect(within(advisor).getByText("Akademik danışmanım")).toBeVisible();
  });

  it("uploads a profile photo", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const photo = region("Profil fotoğrafı");
    const file = new File(["x"], "me.png", { type: "image/png" });
    await user.upload(within(photo).getByLabelText("Fotoğraf Yükle"), file);
    expect(upload).toHaveBeenCalledWith(file);
  });

  it("explains where the details show", () => {
    renderWithQueryClient(<StudentProfileView />);
    expect(screen.getByText("Bilgilerin nerede görünür?")).toBeVisible();
  });
});

describe("StudentProfileView › İlgi alanlarım", () => {
  it("shows the saved interests and goal", async () => {
    renderWithQueryClient(<StudentProfileView />);
    const interests = region("İlgi alanlarım ve hedeflerim");

    expect(await within(interests).findByText("Kariyer ve Staj")).toBeVisible();
    expect(within(interests).getByText("Örnek: CV hazırlama")).toBeVisible();
    expect(within(interests).getByText("Yaz stajı bulmak")).toBeVisible();
  });

  it("edits topics and goal in place, drops sub-topics of a removed topic, and saves", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const interests = region("İlgi alanlarım ve hedeflerim");
    await within(interests).findByText("Kariyer ve Staj");

    await user.click(
      within(interests).getByRole("button", { name: "Düzenle" }),
    );
    await user.click(
      within(interests).getByRole("checkbox", { name: "Kariyer ve Staj" }),
    );
    expect(
      within(interests).queryByRole("checkbox", {
        name: "Örnek: CV hazırlama",
      }),
    ).toBeNull();
    await user.click(
      within(interests).getByRole("checkbox", {
        name: "Uluslararası Fırsatlar",
      }),
    );
    await user.click(
      within(interests).getByRole("checkbox", {
        name: "Örnek: Değişim programları",
      }),
    );
    const goal = within(interests).getByRole("textbox");
    await user.clear(goal);
    await user.type(goal, "  Erasmus'a başvurmak  ");
    await user.click(within(interests).getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(
        vi.mocked(saveStudentProfileCompletion).mock.calls[0]?.[0],
      ).toEqual({
        topics: [PeerTopicCategory.International],
        subtopics: ["fixture-exchange"],
        goal: "Erasmus'a başvurmak",
        completed: true,
        skipped: false,
      }),
    );
    expect(
      await screen.findByText("İlgi alanların güncellendi."),
    ).toBeVisible();
    expect(within(interests).getByText("Uluslararası Fırsatlar")).toBeVisible();
    expect(within(interests).queryByRole("checkbox")).toBeNull();
  });

  it("drops the edits on Vazgeç and keeps them after a failed save", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const interests = region("İlgi alanlarım ve hedeflerim");
    await within(interests).findByText("Kariyer ve Staj");

    await user.click(
      within(interests).getByRole("button", { name: "Düzenle" }),
    );
    await user.type(within(interests).getByRole("textbox"), " ve iş");
    await user.click(within(interests).getByRole("button", { name: "Vazgeç" }));
    expect(within(interests).getByText("Yaz stajı bulmak")).toBeVisible();

    vi.mocked(saveStudentProfileCompletion).mockRejectedValue(new Error("x"));
    await user.click(
      within(interests).getByRole("button", { name: "Düzenle" }),
    );
    await user.type(within(interests).getByRole("textbox"), " ve iş");
    await user.click(within(interests).getByRole("button", { name: "Kaydet" }));
    expect(
      await within(interests).findByText("Kaydedilemedi. Tekrar dene."),
    ).toBeVisible();
    expect(within(interests).getByRole("textbox")).toHaveValue(
      "Yaz stajı bulmak ve iş",
    );
  });

  it("says when nothing was added yet", async () => {
    vi.mocked(getStudentProfileCompletion).mockResolvedValue(
      structuredClone(EMPTY_PROFILE_COMPLETION),
    );
    renderWithQueryClient(<StudentProfileView />);
    expect(
      await screen.findByText(
        "Henüz ilgi alanı seçmedin. Düzenle'ye basıp seçebilirsin.",
      ),
    ).toBeVisible();
  });
});

describe("StudentProfileView › Rozetlerim", () => {
  it("shows the student's badges in Rozetlerim", async () => {
    renderWithQueryClient(<StudentProfileView />);
    expect(
      await within(region("Rozetlerim")).findByText("Akran Mentoru"),
    ).toBeVisible();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentProfileView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { name: "Institutional details" }),
    ).toBeVisible();
    expect(await screen.findByText("Year 3 · Bachelor's")).toBeVisible();
    expect(screen.getByRole("heading", { name: "My badges" })).toBeVisible();
  });
});
