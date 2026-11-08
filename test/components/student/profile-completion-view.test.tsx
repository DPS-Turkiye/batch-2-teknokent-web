import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentProfileCompletionView } from "@/components/student/profile-completion-view";
import {
  getStudentProfileCompletion,
  getProfileCompletionCategories,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import {
  EMPTY_PROFILE_COMPLETION,
  PROFILE_COMPLETION_CATEGORIES,
} from "@/lib/client/fixtures/student-profile-completion";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
  getProfileCompletionCategories: vi.fn(),
  saveStudentProfileCompletion: vi.fn(),
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
});
async function open() {
  const user = userEvent.setup();
  renderWithQueryClient(<StudentProfileCompletionView />);
  await screen.findByText("Akademik Gelişim");
  return user;
}
describe("profile completion component and hook", () => {
  it("offers exactly the board's eight categories and completes all three optional steps", async () => {
    const user = await open();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    await user.click(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    expect(
      screen.getByText(
        /Üretimde kullanılacak alt konu listesi henüz belirlenmedi/,
      ),
    ).toBeVisible();
    await user.click(
      screen.getByRole("checkbox", { name: "Örnek: Ders çalışma" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.type(
      screen.getByRole("textbox"),
      "  Çalışma planı oluşturmak  ",
    );
    await user.click(
      screen.getByRole("button", { name: "Örnek profili tamamla" }),
    );
    expect(await screen.findByText(/Örnek profil tamamlandı/)).toBeVisible();
    expect(saveStudentProfileCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        topics: [PeerTopicCategory.AcademicDevelopment],
        subtopics: ["fixture-study"],
        goal: "Çalışma planı oluşturmak",
        completed: true,
        skipped: false,
      }),
      expect.anything(),
    );
  });
  it("removes selected subtopics when their parent category is deselected", async () => {
    const user = await open();
    await user.click(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Geri" }));
    expect(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    ).toBeChecked();
    await user.click(
      screen.getByRole("checkbox", { name: "Akademik Gelişim" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    expect(screen.getByText(/Henüz alan seçmedin/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(
      screen.getByRole("button", { name: "Örnek profili tamamla" }),
    );
    await screen.findByText(/Örnek profil tamamlandı/);
    expect(saveStudentProfileCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ topics: [], subtopics: [], goal: "" }),
      expect.anything(),
    );
  });
  it.each([0, 1, 2])(
    "can skip at step %s without pretending the profile is complete",
    async (step) => {
      const user = await open();
      for (let i = 0; i < step; i++)
        await user.click(screen.getByRole("button", { name: "Devam et" }));
      await user.click(screen.getByRole("button", { name: "Şimdilik atla" }));
      expect(await screen.findByText(/Şimdilik atladın/)).toBeVisible();
      expect(saveStudentProfileCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false, skipped: true }),
        expect.anything(),
      );
      expect(
        screen.getByRole("link", { name: "Ana sayfaya dön" }),
      ).toHaveAttribute("href", "/student");
    },
  );
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
    expect(await screen.findByText("Akademik Gelişim")).toBeVisible();
  });
  it("retains entered data on save failure and can retry", async () => {
    vi.mocked(saveStudentProfileCompletion).mockRejectedValueOnce(
      new Error("failed"),
    );
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.type(screen.getByRole("textbox"), "Hedefim");
    await user.click(
      screen.getByRole("button", { name: "Örnek profili tamamla" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Örnek profil kaydedilemedi",
    );
    expect(screen.getByRole("textbox")).toHaveValue("Hedefim");
    await user.click(
      screen.getByRole("button", { name: "Örnek profili tamamla" }),
    );
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });
  it("supports English and allows revisiting a previously skipped draft", async () => {
    vi.mocked(getStudentProfileCompletion).mockResolvedValue({
      ...EMPTY_PROFILE_COMPLETION,
      skipped: true,
    });
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentProfileCompletionView />
      </InLocale>,
    );
    expect(await screen.findByText("Academic development")).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeVisible();
    expect(screen.getByText(/Your live profile is not updated/)).toBeVisible();
  });
});
