import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupWizardView } from "@/components/signup/signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import { ContactPreference } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import { getProgramEligibility, registerFounder } from "@/lib/client/auth";
import { listDocuments, uploadDocument } from "@/lib/client/documents";
import { parseCv } from "@/lib/client/profile-analysis";
import { getProgramNames } from "@/lib/client/programs";
import { renderWithQueryClient as render } from "@test/test-utils";

const logout = vi.fn().mockResolvedValue(undefined);
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ logout }),
}));

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
}));

vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn().mockResolvedValue(null),
  saveOnboardingDraft: vi.fn().mockResolvedValue({}),
  clearOnboardingDraft: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/client/auth", () => ({
  registerFounder: vi.fn().mockResolvedValue({}),
  getProgramEligibility: vi.fn(),
}));

vi.mock("@/lib/client/programs", () => ({
  getProgramNames: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/client/profile-analysis", () => ({
  parseCv: vi.fn(),
}));

vi.mock("@/lib/client/documents", () => ({
  listDocuments: vi.fn().mockResolvedValue([]),
  uploadDocument: vi.fn().mockResolvedValue({}),
}));

const ACCOUNT: RegisteredAccount = {
  fullName: "Gülse Buran",
  email: "gulse@dongu.co",
  phone: "+905551112233",
};

type User = ReturnType<typeof userEvent.setup>;

const next = () => screen.getByRole("button", { name: "Devam et" });

async function completePersonalStep(user: User) {
  await user.type(screen.getByLabelText(/^Ad\*?$/), "Gülse");
  await user.type(screen.getByLabelText(/^Soyad/), "Buran");
  await user.type(screen.getByLabelText(/Startup’taki rolün/), "Kurucu ortak");
}

async function chooseProgram(user: User) {
  await user.click(
    await screen.findByRole("button", { name: "metustarts 2026" }),
  );
}

async function completeStartupStep(user: User) {
  await chooseProgram(user);
  await user.type(screen.getByLabelText(/Startup adı/), "Döngü");
  await user.type(
    screen.getByLabelText(/Tek satırlık tanım/),
    "Döngüsel moda platformu",
  );
}

async function reachReview(user: User) {
  await completePersonalStep(user);
  await user.click(next());
  await completeStartupStep(user);
  await user.click(next());
  await user.click(next());
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listDocuments).mockResolvedValue([]);
  vi.mocked(getProgramNames).mockResolvedValue([
    { id: "prog-1", name: "metustarts 2026", individualMentees: false },
  ]);
  vi.mocked(getProgramEligibility).mockResolvedValue({
    eligible: true,
    message: null,
  });
});

describe("Signup wizard", () => {
  it("opens on the personal profile with Devam et shut until the required fields are filled", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    expect(
      screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Geri" })).toBeDisabled();
    expect(next()).toBeDisabled();

    await completePersonalStep(user);
    expect(next()).toBeEnabled();
  });

  it("fills an empty role from a parsed CV", async () => {
    vi.mocked(parseCv).mockResolvedValue({ current_role: "Ürün Yöneticisi" });
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await user.click(
      screen.getByRole("checkbox", { name: /CV'min okunmasını/ }),
    );
    await user.upload(
      screen.getByLabelText(/CV dosyası seç/),
      new File(["cv"], "cv.pdf", { type: "application/pdf" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/Startup’taki rolün/)).toHaveValue(
        "Ürün Yöneticisi",
      ),
    );
  });

  // The mentee's own words win; the CV only fills what is still blank.
  it("does not overwrite a role the mentee already typed", async () => {
    vi.mocked(parseCv).mockResolvedValue({ current_role: "Ürün Yöneticisi" });
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await user.type(screen.getByLabelText(/Startup’taki rolün/), "Kurucu");
    await user.click(
      screen.getByRole("checkbox", { name: /CV'min okunmasını/ }),
    );
    await user.upload(
      screen.getByLabelText(/CV dosyası seç/),
      new File(["cv"], "cv.pdf", { type: "application/pdf" }),
    );

    await waitFor(() => expect(parseCv).toHaveBeenCalled());
    expect(screen.getByLabelText(/Startup’taki rolün/)).toHaveValue("Kurucu");
  });

  it("says so when the CV cannot be read", async () => {
    vi.mocked(parseCv).mockRejectedValue(
      new Error("CV okunamadı. Bilgileri elle girebilirsin."),
    );
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await user.click(
      screen.getByRole("checkbox", { name: /CV'min okunmasını/ }),
    );
    await user.upload(
      screen.getByLabelText(/CV dosyası seç/),
      new File(["cv"], "cv.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("CV okunamadı");
  });

  it("keeps a CV without reading it while the consent box is unticked", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    expect(
      screen.getByRole("checkbox", { name: /CV'min okunmasını/ }),
    ).not.toBeChecked();
    await user.upload(
      screen.getByLabelText(/CV dosyası seç/),
      new File(["cv"], "cv.pdf", { type: "application/pdf" }),
    );

    expect(screen.getByText("cv.pdf")).toBeInTheDocument();
    expect(parseCv).not.toHaveBeenCalled();
  });

  it("shows an already-uploaded CV on a resumed session", async () => {
    vi.mocked(listDocuments).mockResolvedValue([
      {
        id: "doc-1",
        kind: DocumentKind.Cv,
        originalFilename: "gulse-cv.pdf",
        sizeBytes: 1024,
      },
    ]);
    render(<SignupWizardView account={ACCOUNT} />);

    expect(await screen.findByText("gulse-cv.pdf")).toBeInTheDocument();
    expect(screen.getByText("Daha önce yüklendi")).toBeInTheDocument();
  });

  it("needs only a program, the startup name and tagline on step 2", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());

    expect(
      screen.getByRole("heading", { name: "Startup profilini oluştur" }),
    ).toBeInTheDocument();
    expect(next()).toBeDisabled();
    await completeStartupStep(user);
    expect(next()).toBeEnabled();
    expect(screen.queryByLabelText(/Problem/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Sektör/)).not.toBeInTheDocument();
  });

  it("offers only the coordinator's real programs", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "prog-1", name: "metustarts 2026", individualMentees: false },
      { id: "prog-2", name: "Seed 2026", individualMentees: false },
    ]);
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());

    const programs = await screen.findByRole("group", { name: "Program" });
    expect(
      within(programs).getByRole("button", { name: "metustarts 2026" }),
    ).toBeInTheDocument();
    expect(
      within(programs).getByRole("button", { name: "Seed 2026" }),
    ).toBeInTheDocument();
    expect(
      within(programs).queryByRole("button", { name: "Bağımsız" }),
    ).not.toBeInTheDocument();
  });

  it("tells a student at once that İŞKUR will not take their address, and holds Devam", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "iskur", name: "İŞKUR", individualMentees: true },
    ]);
    vi.mocked(getProgramEligibility).mockResolvedValue({
      eligible: false,
      message: "gulse@dongu.co bu programa katılamaz.",
    });
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());
    await user.click(await screen.findByRole("button", { name: "İŞKUR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "gulse@dongu.co bu programa katılamaz.",
    );
    expect(getProgramEligibility).toHaveBeenCalledWith("iskur", "id-token");
    expect(next()).toBeDisabled();
    expect(screen.queryByLabelText(/Startup adı/)).not.toBeInTheDocument();
  });

  it("lets a listed student into İŞKUR without startup questions", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "iskur", name: "İŞKUR", individualMentees: true },
    ]);
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());
    await user.click(await screen.findByRole("button", { name: "İŞKUR" }));

    expect(
      await screen.findByText(
        "Bu programa bireysel katılıyorsun; startup bilgisi gerekmez.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(next()).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Startup adı/)).not.toBeInTheDocument();
  });

  it("offers no way to sign up without a startup in a startup program", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());
    await chooseProgram(user);

    expect(next()).toBeDisabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/daha sonra oluştur/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Startup adı/)).toBeInTheDocument();
  });

  it("signs an İŞKUR student up without a startup and says the peer mentoring area opens after approval", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "iskur", name: "İŞKUR", individualMentees: true },
    ]);
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(next());
    await user.click(await screen.findByRole("button", { name: "İŞKUR" }));
    await waitFor(() => expect(next()).toBeEnabled());
    await user.click(next());

    expect(
      screen.getByRole("heading", { name: "Gözden geçir ve gönder" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Koordinatöre gönder" }),
    );

    await waitFor(() =>
      expect(registerFounder).toHaveBeenCalledWith(
        expect.objectContaining({ programId: "iskur" }),
        "id-token",
      ),
    );
    expect(registerFounder).toHaveBeenCalledWith(
      expect.not.objectContaining({ organizationName: expect.anything() }),
      "id-token",
    );
    expect(
      await screen.findByRole("heading", {
        name: "Başvurun alındı; koordinatör onayından sonra akran mentörlüğü alanın açılacak.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Akran mentörlüğü alanın açılır"),
    ).toBeInTheDocument();
  });

  it("returns to the matching step when a review section is edited", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await reachReview(user);
    const personal = screen
      .getByRole("heading", { name: "Kişisel profil" })
      .closest("section")!;
    await user.click(within(personal).getByRole("button", { name: "Düzenle" }));

    expect(
      screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
    ).toBeInTheDocument();
  });

  it("sends the whole application, then shows the submitted screen", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: "E-posta" }));
    await user.click(next());

    await completeStartupStep(user);
    await user.click(screen.getByRole("button", { name: "Prototip" }));
    await user.click(screen.getByRole("button", { name: "+ Üye ekle" }));
    await user.type(screen.getByLabelText(/Ad soyad/), "Ece Kaya");
    await user.type(screen.getByLabelText(/^Rol/), "CTO");
    await user.click(screen.getByRole("button", { name: "Ekle" }));
    expect(screen.getByText("Ece Kaya")).toBeInTheDocument();
    await user.click(next());

    const deck = new File(["deck"], "deck.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Pitch Deck dosyası seç"), deck);
    await user.type(screen.getByLabelText(/Bağlantı/), "https://app.dongu.co");
    await user.click(next());

    const send = screen.getByRole("button", { name: "Koordinatöre gönder" });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(send);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Döngü profili koordinatöre gönderildi",
        }),
      ).toBeInTheDocument(),
    );
    expect(registerFounder).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Gülse Buran",
        email: "gulse@dongu.co",
        organizationName: "Döngü",
        description: "Döngüsel moda platformu",
        jobTitle: "Kurucu ortak",
        programId: "prog-1",
        maturity: "Prototip",
        contactPreferences: [ContactPreference.Email],
        mvpUrl: "https://app.dongu.co",
        teamMembers: [
          { fullName: "Ece Kaya", jobTitle: "CTO", email: undefined },
        ],
      }),
      "id-token",
    );
    expect(uploadDocument).toHaveBeenCalledWith(deck, "pitch-deck", "id-token");
    expect(
      screen.getByRole("link", { name: "Gönderilen profili görüntüle" }),
    ).toHaveAttribute("href", "/application-status");
  });

  it("names the fields the backend refused instead of a generic message", async () => {
    vi.mocked(registerFounder).mockRejectedValueOnce(
      new ClientApiError("Gönderilen bilgiler geçersiz.", 400, undefined, {
        phone: "must match",
        "teamMembers[0].email": "must be a well-formed email address",
      }),
    );
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await reachReview(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Koordinatöre gönder" }),
    );

    expect(
      await screen.findByText(
        "Şu alanlar geçersiz: Telefon, Ekip üyeleri. Düzeltip tekrar gönder.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the backend's reason when the address already has an account", async () => {
    vi.mocked(registerFounder).mockRejectedValueOnce(
      new ClientApiError(
        "Bu e-posta adresiyle kayıtlı bir hesap zaten var. Kayıt olmak yerine giriş yap.",
        400,
        "EMAIL_ALREADY_REGISTERED",
      ),
    );
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await reachReview(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Koordinatöre gönder" }),
    );

    expect(
      await screen.findByText(
        "Bu e-posta adresiyle kayıtlı bir hesap zaten var. Kayıt olmak yerine giriş yap.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the wizard open and explains a failed submission", async () => {
    vi.mocked(registerFounder).mockRejectedValueOnce(
      new Error("Kayıt tamamlanamadı."),
    );
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await reachReview(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Koordinatöre gönder" }),
    );

    expect(await screen.findByText("Kayıt tamamlanamadı.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gözden geçir ve gönder" }),
    ).toBeInTheDocument();
  });
});
