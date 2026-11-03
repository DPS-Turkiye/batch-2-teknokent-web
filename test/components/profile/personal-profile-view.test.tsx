import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalProfileView } from "@/components/profile/personal-profile-view";
import { usePersonalCv } from "@/hooks/use-personal-cv";
import { usePersonalProfilePage } from "@/hooks/use-personal-profile-page";
import { ProfileChipTone } from "@/lib/personal-profile";

vi.mock("@/components/profile/personal-analysis-archive", () => ({
  PersonalAnalysisArchive: () => null,
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-personal-profile-page", () => ({
  usePersonalProfilePage: vi.fn(),
}));

vi.mock("@/hooks/use-personal-cv", () => ({ usePersonalCv: vi.fn() }));

const cvActions = {
  choose: vi.fn(),
  fillFromStored: vi.fn(),
  setExpertise: vi.fn(),
};

function mockCv(overrides: Record<string, unknown> = {}) {
  vi.mocked(usePersonalCv).mockReturnValue({
    ...cvActions,
    selected: null,
    storedName: "gulse-cv.pdf",
    storedIsPdf: true,
    canFill: true,
    isUploading: false,
    isParsing: false,
    error: null,
    filled: false,
    expertise: ["UX Research"],
    ...overrides,
  });
}

const actions = {
  cancelEditing: vi.fn(),
  save: vi.fn(),
  sendPasswordReset: vi.fn(),
  setField: vi.fn(),
  showComingSoon: vi.fn(),
  startEditing: vi.fn(),
};
const upload = vi.fn();

function mockPage(overrides: Record<string, unknown> = {}) {
  vi.mocked(usePersonalProfilePage).mockReturnValue({
    ...actions,
    isLoading: false,
    loadError: null,
    fullName: "Gülse Buran",
    initials: "GB",
    email: "gulse@dongu.app",
    role: "Product Designer · Kurucu",
    subtitle: "Product Designer · Kurucu · Döngü",
    chips: [
      { label: "METU Stars 2026", tone: ProfileChipTone.Program },
      { label: "Mentorluk alıyor", tone: ProfileChipTone.Active },
      { label: "Pre-seed", tone: ProfileChipTone.Neutral },
    ],
    photo: { photoUrl: null, isUploading: false, upload },
    draft: {
      fullName: "Gülse Buran",
      jobTitle: "Product Designer",
      phone: null,
      bio: "Döngü’nün kurucu ortağıyım.",
      linkedinUrl: null,
      expertise: [],
    },
    fieldErrors: {},
    canSave: true,
    isSaving: false,
    saveError: null,
    isEditing: false,
    startup: {
      name: "Döngü",
      initials: "DÖ",
      logoUrl: null,
      summary: "Pre-seed · 4 kişilik ekip · MVP yayında",
    },
    mentorships: [
      {
        id: "r1",
        mentorName: "Nihan Öztürk",
        initials: "NÖ",
        detail: "Ürün konumlandırma · 3/6 seans",
        status: "Sonraki görüşme 30 Ağu",
        href: "/mentor-request/status?id=r1",
      },
    ],
    mentorshipsLoading: false,
    isSendingReset: false,
    ...overrides,
  } as unknown as ReturnType<typeof usePersonalProfilePage>);
}

describe("PersonalProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCv();
  });

  it("reports loading and load errors", () => {
    mockPage({ isLoading: true });
    const { unmount } = render(<PersonalProfileView />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    unmount();

    mockPage({ loadError: "Profil yüklenemedi.", draft: null });
    render(<PersonalProfileView />);
    expect(screen.getByText("Profil yüklenemedi.")).toBeInTheDocument();
  });

  it("introduces the person with their role and chips", async () => {
    const user = userEvent.setup();
    mockPage();
    render(<PersonalProfileView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gülse Buran" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Product Designer · Kurucu · Döngü"),
    ).toBeInTheDocument();
    for (const label of ["METU Stars 2026", "Mentorluk alıyor", "Pre-seed"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Hesap ayarları" }));
    await user.click(screen.getByRole("button", { name: "Profili düzenle" }));
    expect(actions.showComingSoon).toHaveBeenCalled();
    expect(actions.startEditing).toHaveBeenCalled();
  });

  it("uploads a chosen photo and shows an existing one", async () => {
    const user = userEvent.setup();
    mockPage();
    const { unmount } = render(<PersonalProfileView />);
    const file = new File(["png"], "me.png", { type: "image/png" });

    await user.upload(screen.getByLabelText("Profil fotoğrafı dosyası"), file);
    expect(upload).toHaveBeenCalledWith(file);
    unmount();

    mockPage({
      photo: {
        photoUrl: "https://files.example/me.png",
        isUploading: false,
        upload,
      },
    });
    render(<PersonalProfileView />);
    expect(
      screen.getByRole("img", { name: "Gülse Buran profil fotoğrafı" }),
    ).toBeInTheDocument();
  });

  it("reads the about, startup, mentorship, contact and account cards", async () => {
    const user = userEvent.setup();
    mockPage();
    render(<PersonalProfileView />);

    expect(screen.getByText("Döngü’nün kurucu ortağıyım.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Startup profiline git →" }),
    ).toHaveAttribute("href", "/startup");
    expect(
      screen.getByText("Pre-seed · 4 kişilik ekip · MVP yayında"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tümü →" })).toHaveAttribute(
      "href",
      "/mentorships",
    );
    const mentorship = screen.getByRole("link", { name: /Nihan Öztürk/ });
    expect(mentorship).toHaveAttribute("href", "/mentor-request/status?id=r1");
    expect(
      within(mentorship).getByText("Ürün konumlandırma · 3/6 seans"),
    ).toBeInTheDocument();
    expect(
      within(mentorship).getByText("Sonraki görüşme 30 Ağu"),
    ).toBeInTheDocument();
    expect(screen.getByText("gulse@dongu.app")).toBeInTheDocument();
    expect(screen.getByText("Product Designer · Kurucu")).toBeInTheDocument();
    expect(screen.getByText("Uygulama içi")).toBeInTheDocument();
    expect(screen.getByText("Bağlı değil")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Sıfırlama e-postası gönder" }),
    );
    await user.click(screen.getByRole("button", { name: "Hakkımda düzenle" }));
    expect(actions.sendPasswordReset).toHaveBeenCalled();
    expect(actions.startEditing).toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("notes what is empty", () => {
    mockPage({
      startup: null,
      mentorships: [],
      draft: {
        fullName: "Gülse Buran",
        jobTitle: null,
        phone: null,
        bio: null,
        linkedinUrl: null,
        expertise: [],
      },
    });
    render(<PersonalProfileView />);

    expect(
      screen.queryByRole("heading", { name: "Startup’ım" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Henüz aktif bir mentorluğun yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Henüz hakkında bilgisi eklenmedi."),
    ).toBeInTheDocument();
  });

  it("edits the bio, name and role, and saves or discards", async () => {
    const user = userEvent.setup();
    mockPage({ isEditing: true, saveError: "Değişiklikler kaydedilemedi." });
    render(<PersonalProfileView />);

    expect(
      screen.queryByRole("button", { name: "Hakkımda düzenle" }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Hakkımda"), "!");
    await user.type(screen.getByLabelText("Ad soyad"), "!");
    await user.type(screen.getByLabelText("Rol"), "!");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(actions.setField).toHaveBeenCalledWith(
      "bio",
      "Döngü’nün kurucu ortağıyım.!",
    );
    expect(actions.setField).toHaveBeenCalledWith("fullName", "Gülse Buran!");
    expect(actions.setField).toHaveBeenCalledWith(
      "jobTitle",
      "Product Designer!",
    );
    expect(actions.save).toHaveBeenCalled();
    expect(actions.cancelEditing).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Değişiklikler kaydedilemedi.",
    );
  });

  it("keeps Kaydet disabled until there is something valid to save", () => {
    mockPage({ isEditing: true, canSave: false });
    render(<PersonalProfileView />);

    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();
  });

  it("shows the CV only while editing", () => {
    mockPage();
    render(<PersonalProfileView />);

    expect(
      screen.queryByRole("heading", { name: "CV" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profili CV'den doldur" }),
    ).not.toBeInTheDocument();
  });

  it("fills the profile from the stored CV and edits the expertise", async () => {
    const user = userEvent.setup();
    mockPage({ isEditing: true });
    mockCv();
    render(<PersonalProfileView />);

    expect(screen.getByText("gulse-cv.pdf")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Profili CV'den doldur" }),
    );
    await user.click(
      screen.getByRole("button", { name: "UX Research alanını kaldır" }),
    );

    expect(cvActions.fillFromStored).toHaveBeenCalled();
    expect(cvActions.setExpertise).toHaveBeenCalledWith([]);
  });

  it("says what the CV is doing and when it is done", () => {
    mockPage({ isEditing: true });
    mockCv({ isParsing: true, canFill: false });
    const { rerender } = render(<PersonalProfileView />);

    expect(screen.getByRole("status")).toHaveTextContent("CV okunuyor");
    expect(
      screen.getByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeDisabled();

    mockCv({ filled: true });
    rerender(<PersonalProfileView />);
    expect(screen.getByRole("status")).toHaveTextContent("CV okundu");

    mockCv({ error: "Only a PDF CV can be read into the profile." });
    rerender(<PersonalProfileView />);
    expect(screen.getByRole("alert")).toHaveTextContent("Only a PDF CV");
  });

  it("asks for a PDF when the stored CV cannot be read", () => {
    mockPage({ isEditing: true });
    mockCv({ storedName: "gulse-cv.docx", storedIsPdf: false, canFill: false });
    render(<PersonalProfileView />);

    expect(
      screen.getByText("Profili doldurmak için CV'ni PDF olarak yükle."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profili CV'den doldur" }),
    ).not.toBeInTheDocument();
  });
  it("edits phone and LinkedIn on the current personal profile", async () => {
    const user = userEvent.setup();
    mockPage({ isEditing: true });
    render(<PersonalProfileView />);
    await user.type(screen.getByLabelText("Telefon"), "5");
    await user.type(screen.getByLabelText("LinkedIn"), "l");
    expect(actions.setField).toHaveBeenCalledWith("phone", "5");
    expect(actions.setField).toHaveBeenCalledWith("linkedinUrl", "l");
  });
  it("shows phone validation errors next to the editable field", () => {
    mockPage({ isEditing: true, fieldErrors: { phone: "Telefon geçersiz" } });
    render(<PersonalProfileView />);
    expect(screen.getByLabelText("Telefon")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Telefon geçersiz");
  });
  it("shows the saved phone and LinkedIn, linking only an http(s) address", () => {
    const draft = {
      fullName: "Gülse Buran",
      jobTitle: "Product Designer",
      phone: "05320000000",
      bio: null,
      linkedinUrl: "https://www.linkedin.com/in/gulse",
      expertise: [],
    };
    mockPage({ draft });
    const { unmount } = render(<PersonalProfileView />);
    expect(screen.getByText("05320000000")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "linkedin.com/in/gulse" }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/gulse");
    unmount();

    mockPage({ draft: { ...draft, linkedinUrl: "javascript:alert(1)" } });
    render(<PersonalProfileView />);
    expect(screen.getByText("javascript:alert(1)").closest("a")).toBeNull();
  });
});
