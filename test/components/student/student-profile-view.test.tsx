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

describe("StudentProfileView › Kurumsal Bilgiler", () => {
  it("shows the ODTÜ record read-only", async () => {
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal Bilgiler");

    expect(
      await within(institution).findByText("Bilgisayar Mühendisliği"),
    ).toBeVisible();
    expect(within(institution).getByText("3. sınıf")).toBeVisible();
    expect(within(institution).getByText("Lisans")).toBeVisible();
    expect(
      within(institution).getByText("Dr. Öğr. Üyesi Ahmet Öztürk"),
    ).toBeVisible();
    expect(within(institution).getByText("Katılımcı değil")).toBeVisible();
    expect(within(institution).getByText(/Son güncelleme:/)).toBeVisible();
    expect(within(institution).queryByRole("textbox")).toBeNull();
    expect(within(institution).queryByRole("button")).toBeNull();
  });

  it("fills unknown fields with a dash and says when nothing was synced", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue({
      ...RECORD,
      faculty: null,
      advisor: null,
      syncedAt: null,
      iskurParticipant: true,
    });
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal Bilgiler");

    expect(await within(institution).findByText("Katılımcı")).toBeVisible();
    expect(within(institution).getAllByText("—")).toHaveLength(2);
    expect(within(institution).getByText(/Henüz güncellenmedi/)).toBeVisible();
  });

  it("treats a 404 as an account without ODTÜ details, not as an error", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Bulunamadı", 404),
    );
    renderWithQueryClient(<StudentProfileView />);

    expect(
      await screen.findByText(
        "Bu hesap için ODTÜ'den gelen bilgi yok",
        {},
        {
          timeout: 4000,
        },
      ),
    ).toBeVisible();
    expect(within(region("Kurumsal Bilgiler")).queryByRole("alert")).toBeNull();
  });

  it("offers a retry when the record fails to load", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 500),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const institution = region("Kurumsal Bilgiler");

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

describe("StudentProfileView › İlgi alanların", () => {
  it("shows the saved interests and goal", async () => {
    renderWithQueryClient(<StudentProfileView />);
    const interests = region("İlgi alanların ve hedefin");

    expect(await within(interests).findByText("Kariyer ve Staj")).toBeVisible();
    expect(within(interests).getByText("Örnek: CV hazırlama")).toBeVisible();
    expect(within(interests).getByText("Yaz stajı bulmak")).toBeVisible();
    expect(within(interests).getByText(/hesabına kaydedilmez/)).toBeVisible();
  });

  it("edits topics and goal in place, drops sub-topics of a removed topic, and saves", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileView />);
    const interests = region("İlgi alanların ve hedefin");
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
    const interests = region("İlgi alanların ve hedefin");
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
      await within(interests).findByText(
        "İlgi alanların kaydedilemedi. Tekrar deneyebilirsin.",
      ),
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
      await screen.findByText("Henüz ilgi alanı veya hedef eklemedin."),
    ).toBeVisible();
  });
});

describe("StudentProfileView › Rozetlerim", () => {
  it("keeps badges as a placeholder until the badge API lands", async () => {
    renderWithQueryClient(<StudentProfileView />);
    expect(
      within(region("Rozetlerim")).getByText("Rozetlerin yakında burada"),
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
    expect(await screen.findByText("Year 3")).toBeVisible();
    expect(screen.getByText("Bachelor's")).toBeVisible();
    expect(screen.getByRole("heading", { name: "My badges" })).toBeVisible();
  });
});
