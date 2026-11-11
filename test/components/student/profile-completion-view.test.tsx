import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentProfileCompletionView } from "@/components/student/profile-completion-view";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import { listOwnDocuments, uploadDocument } from "@/lib/client/documents";
import {
  EMPTY_PROFILE_COMPLETION,
  PROFILE_COMPLETION_CATEGORIES,
} from "@/lib/client/fixtures/student-profile-completion";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { getDocumentDownloadUrl } from "@/lib/client/startup-documents";
import {
  getProfileCompletionCategories,
  getStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import {
  STUDENT_AVATAR,
  STUDENT_RECORD,
} from "@test/fixtures/profile-completion";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
  getProfileCompletionCategories: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({
  listOwnDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}));
vi.mock("@/lib/client/startup-documents", () => ({
  getDocumentDownloadUrl: vi.fn(),
  getStartupDocuments: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getStudentProfileCompletion)
    .mockReset()
    .mockResolvedValue(structuredClone(EMPTY_PROFILE_COMPLETION));
  vi.mocked(getProfileCompletionCategories)
    .mockReset()
    .mockResolvedValue(PROFILE_COMPLETION_CATEGORIES);
  vi.mocked(saveStudentProfileCompletion)
    .mockReset()
    .mockImplementation(async (data) => data);
  vi.mocked(fetchInstitutionRecord)
    .mockReset()
    .mockResolvedValue(STUDENT_RECORD);
  vi.mocked(listOwnDocuments).mockReset().mockResolvedValue([]);
  vi.mocked(uploadDocument).mockReset().mockResolvedValue(STUDENT_AVATAR);
  vi.mocked(getDocumentDownloadUrl).mockReset();
});

async function open() {
  const user = userEvent.setup();
  renderWithQueryClient(<StudentProfileCompletionView />);
  await screen.findByRole("heading", { name: "Hoş geldin, Ayşe" });
  return user;
}

function continueButton() {
  return screen.getByRole("button", { name: "Devam Et" });
}

function currentStep() {
  return screen
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step");
}

describe("profile completion wizard", () => {
  it("opens on the ODTÜ record, read-only, with the step list", async () => {
    await open();
    const record = screen.getByRole("region", {
      name: "ODTÜ'den gelen bilgiler",
    });
    expect(within(record).getByText("Düzenlenemez")).toBeVisible();
    expect(within(record).getByText("Endüstri Mühendisliği")).toBeVisible();
    expect(within(record).getByText("3. sınıf · Lisans")).toBeVisible();
    expect(within(record).getByText("Doç. Dr. Elif Şahin")).toBeVisible();
    expect(within(record).queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Profilini tamamla · 1/3")).toBeVisible();
    expect(currentStep()).toHaveTextContent("Hoş geldin");
    // The first step has nothing to go back to.
    expect(screen.queryByRole("button", { name: "Geri" })).toBeNull();
    expect(screen.getByText("AY")).toBeVisible();
  });

  it("walks the three steps and saves the choices with a trimmed goal", async () => {
    const user = await open();
    await user.click(continueButton());
    expect(
      screen.getByRole("heading", {
        name: "Hangi konularda destek almak istersin?",
      }),
    ).toBeVisible();
    expect(currentStep()).toHaveTextContent("Destek konuların");
    expect(screen.getByRole("img", { name: "Tamamlandı" })).toBeVisible();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    expect(
      screen.getByText("Bir konu seçtiğinde alt konuları burada görürsün."),
    ).toBeVisible();

    await user.click(screen.getByRole("checkbox", { name: "Kariyer ve Staj" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: CV hazırlama" }),
    );
    expect(
      screen.getByRole("checkbox", { name: "Örnek: CV hazırlama" }),
    ).toBeChecked();
    await user.click(continueButton());

    expect(currentStep()).toHaveTextContent("Hedefin");
    const summary = screen.getByRole("region", { name: "Seçimlerin" });
    expect(within(summary).getByText("Kariyer ve Staj")).toBeVisible();
    expect(within(summary).getByText("Örnek: CV hazırlama")).toBeVisible();
    await user.type(
      screen.getByRole("textbox", { name: "Hedefin veya beklentin" }),
      "  Staj bulmak  ",
    );
    expect(screen.getByText("15 / 1000")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Profili Tamamla" }));

    expect(await screen.findByText(/Profilin tamamlandı/)).toBeVisible();
    expect(saveStudentProfileCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        topics: [PeerTopicCategory.CareerInternship],
        subtopics: ["fixture-cv"],
        goal: "Staj bulmak",
        completed: true,
        skipped: false,
      }),
      expect.anything(),
    );
    expect(
      screen.getByRole("link", { name: "Ana sayfaya dön" }),
    ).toHaveAttribute("href", "/student");
  });

  it("drops a topic's sub-topics when the topic is unticked, and goes back", async () => {
    const user = await open();
    await user.click(continueButton());
    await user.click(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: Ders çalışma" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    );
    expect(
      screen.queryByRole("checkbox", { name: "Örnek: Ders çalışma" }),
    ).toBeNull();
    await user.click(continueButton());
    expect(screen.getByText("Henüz bir konu seçmedin.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Geri" }));
    await user.click(screen.getByRole("button", { name: "Geri" }));
    expect(
      screen.getByRole("heading", { name: "Hoş geldin, Ayşe" }),
    ).toBeVisible();
  });

  it.each([0, 1, 2])(
    "can skip at step %s without marking the profile complete",
    async (step) => {
      const user = await open();
      for (let i = 0; i < step; i++) await user.click(continueButton());
      await user.click(screen.getByRole("button", { name: "Şimdilik Atla" }));
      expect(await screen.findByText(/Şimdilik atladın/)).toBeVisible();
      expect(saveStudentProfileCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false, skipped: true }),
        expect.anything(),
      );
    },
  );

  it("explains an empty topic list while the program has no active category", async () => {
    vi.mocked(getProfileCompletionCategories).mockResolvedValue([]);
    const user = await open();
    await user.click(continueButton());
    expect(
      screen.getByText(/Programında henüz etkin kategori yok/),
    ).toBeVisible();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("says so when no ODTÜ record backs the account", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Bulunamadı", 404),
    );
    renderWithQueryClient(<StudentProfileCompletionView />);
    expect(
      await screen.findByText(/ODTÜ kaydı bulamadık/, {}, { timeout: 4000 }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Hoş geldin" })).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("offers a retry when the ODTÜ record fails to load", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 500),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileCompletionView />);
    const alert = await screen.findByRole("alert", {}, { timeout: 4000 });
    expect(alert).toHaveTextContent("ODTÜ bilgilerin yüklenemedi");
    vi.mocked(fetchInstitutionRecord).mockResolvedValue(STUDENT_RECORD);
    await user.click(
      within(alert).getByRole("button", { name: "Tekrar dene" }),
    );
    expect(await screen.findByText("Endüstri Mühendisliği")).toBeVisible();
  });

  it("uploads a profile photo as the avatar", async () => {
    const user = await open();
    const file = new File(["png"], "me.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Fotoğraf Yükle"), file);
    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Avatar),
    );
  });

  it("shows the saved photo instead of the initials", async () => {
    vi.mocked(listOwnDocuments).mockResolvedValue([STUDENT_AVATAR]);
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue({
      url: "https://files.invalid/me.png",
      filename: "me.png",
      contentType: "image/png",
    });
    await open();
    expect(
      await screen.findByRole("img", { name: "Profil fotoğrafın" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Fotoğrafı değiştir")).toBeInTheDocument();
    expect(screen.queryByText("AY")).toBeNull();
  });

  it("shows loading, then recovers from a read failure", async () => {
    vi.mocked(getStudentProfileCompletion).mockRejectedValueOnce(
      new Error("offline"),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentProfileCompletionView />);
    expect(screen.getByRole("status")).toHaveTextContent("Profil yükleniyor");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profil yüklenemedi",
    );
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(
      await screen.findByRole("heading", { name: "Hoş geldin, Ayşe" }),
    ).toBeVisible();
  });

  it("keeps the goal on a save failure and can retry", async () => {
    vi.mocked(saveStudentProfileCompletion).mockRejectedValueOnce(
      new Error("failed"),
    );
    const user = await open();
    await user.click(continueButton());
    await user.click(continueButton());
    await user.type(screen.getByRole("textbox"), "Hedefim");
    await user.click(screen.getByRole("button", { name: "Profili Tamamla" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profilin kaydedilemedi",
    );
    expect(screen.getByRole("textbox")).toHaveValue("Hedefim");
    await user.click(screen.getByRole("button", { name: "Profili Tamamla" }));
    expect(await screen.findByText(/Profilin tamamlandı/)).toBeVisible();
  });

  it("moves focus to the new step when going forward", async () => {
    const user = await open();
    await user.click(continueButton());
    const heading = screen.getByRole("heading", {
      name: "Hangi konularda destek almak istersin?",
    });
    expect(heading.closest("[tabindex='-1']")).toHaveFocus();
  });

  it("clears a save failure when the student goes back a step", async () => {
    vi.mocked(saveStudentProfileCompletion).mockRejectedValueOnce(
      new Error("failed"),
    );
    const user = await open();
    await user.click(continueButton());
    await user.click(continueButton());
    await user.click(screen.getByRole("button", { name: "Profili Tamamla" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profilin kaydedilemedi",
    );
    await user.click(screen.getByRole("button", { name: "Geri" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("supports English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentProfileCompletionView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome, Ayşe" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeVisible();
    expect(screen.getByText("Year 3 · Bachelor's")).toBeVisible();
  });
});
