import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupFlow } from "@/components/signup/signup-flow";
import { UserRole } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { fetchAccountStatus, registerMentor } from "@/lib/client/auth";
import { currentFirebaseAccount } from "@/lib/firebase/auth";
import { backendUser } from "@test/fixtures/session";

const searchParams = new URLSearchParams();
const replace = vi.fn();
const push = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace, push }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ logout }),
}));

const ROLE_HEADING = "menton’a nasıl katılmak istiyorsun?";

vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn(),
  currentFirebaseAccount: vi.fn().mockResolvedValue(null),
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
  isCurrentEmailVerified: () => true,
  describeAuthError: () => "Kimlik doğrulama tamamlanamadı.",
}));

vi.mock("@/lib/client/auth", () => ({
  fetchAccountStatus: vi.fn(),
  registerMentor: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/components/signup/signup-wizard", () => ({
  SignupWizardView: ({ account }: { account: { email: string } }) => (
    <div data-testid="wizard">{account.email}</div>
  ),
}));

vi.mock("@/components/mentor-onboarding/mentor-onboarding-flow", () => ({
  MentorOnboardingFlow: () => <div data-testid="mentor-onboarding" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  searchParams.delete("role");
  searchParams.delete("resume");
  searchParams.delete("programInvite");
  vi.mocked(currentFirebaseAccount).mockResolvedValue(null);
  vi.mocked(registerMentor).mockResolvedValue(
    backendUser({ role: UserRole.Mentor }),
  );
  vi.mocked(fetchAccountStatus).mockRejectedValue(
    new ClientApiError("Registration required", 401),
  );
});

describe("SignupFlow resume", () => {
  it("opens on the role page when no role is chosen yet", () => {
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: ROLE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Kodunla doğrudan devam edebilirsin." }),
    ).toHaveAttribute("href", "/invite");
    // Nobody is signed in yet, so there is nothing to sign out of.
    expect(
      screen.queryByRole("button", { name: "Çıkış yap" }),
    ).not.toBeInTheDocument();
    expect(currentFirebaseAccount).not.toHaveBeenCalled();
  });

  it("moves to the founder account form and records the role in the URL", async () => {
    render(<SignupFlow />);
    await userEvent.click(
      screen.getByRole("button", { name: "Girişimci olarak devam et" }),
    );

    expect(
      screen.getByRole("heading", { name: "Startup’ınla menton’a katıl" }),
    ).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/signup?role=founder");
  });

  it("opens the mentor account form straight from ?role=mentor", () => {
    searchParams.set("role", "mentor");
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: "Mentor olarak menton’a katıl" }),
    ).toBeInTheDocument();
  });

  it("ignores an unknown role value and shows the role page", () => {
    searchParams.set("role", "admin");
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: ROLE_HEADING }),
    ).toBeInTheDocument();
  });

  it("waits for Firebase to restore a cold session before showing the resume picker", async () => {
    searchParams.set("resume", "1");
    let restoreAccount!: (value: {
      email: string;
      fullName: string;
      verified: boolean;
    }) => void;
    vi.mocked(currentFirebaseAccount).mockReturnValue(
      new Promise((resolve) => {
        restoreAccount = resolve;
      }),
    );

    render(<SignupFlow />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Oturum bilgileri kontrol ediliyor…",
    );
    await act(async () => {
      restoreAccount({
        email: "gulse@dongu.co",
        fullName: "Gülse Yılmaz",
        verified: true,
      });
    });

    expect(
      await screen.findByRole("heading", { name: ROLE_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Çıkış yap" }),
    ).toBeInTheDocument();
  });

  it("opens the startup wizard after the resume picker chooses startup", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "gulse@dongu.co",
      fullName: "Gülse Yılmaz",
      verified: true,
    });

    render(<SignupFlow />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Girişimci olarak devam et" }),
    );

    expect(await screen.findByTestId("wizard")).toHaveTextContent(
      "gulse@dongu.co",
    );
    expect(replace).toHaveBeenCalledWith("/signup?role=founder&resume=1");
  });

  it("sends a founder whose login already has an account to sign in instead of the wizard", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "founder");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "gulse@dongu.co",
      fullName: "Gülse Yılmaz",
      verified: true,
    });
    vi.mocked(fetchAccountStatus).mockResolvedValue(backendUser());

    render(<SignupFlow />);

    expect(
      await screen.findByRole("heading", {
        name: "Bu e-postayla zaten bir hesabın var",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gulse@dongu.co adresiyle kayıtlı/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByTestId("wizard")).not.toBeInTheDocument();
  });

  it("collects missing identity and registers a mentor resumed in another session", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "mentor");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "leyla@mentor.co",
      fullName: "",
      verified: true,
    });
    vi.mocked(fetchAccountStatus).mockRejectedValue(
      new ClientApiError("Registration required", 401),
    );
    const user = userEvent.setup();

    render(<SignupFlow />);

    expect(
      await screen.findByRole("heading", { name: "Mentor hesabını tamamla" }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Ad soyad/), "Leyla Aksoy");
    await user.type(screen.getByLabelText("Telefon"), "+905551112233");
    await user.click(
      screen.getByRole("button", { name: "Mentor profiline devam et" }),
    );

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
    expect(registerMentor).toHaveBeenCalledWith(
      {
        email: "leyla@mentor.co",
        fullName: "Leyla Aksoy",
        phone: "+905551112233",
      },
      "id-token",
    );
  });

  it("passes a program's invite code on to the mentor registration", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "mentor");
    searchParams.set("programInvite", "abc123");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "cagri@yilmazfinans.com",
      fullName: "",
      verified: true,
    });
    vi.mocked(fetchAccountStatus).mockRejectedValue(
      new ClientApiError("Registration required", 401),
    );
    const user = userEvent.setup();

    render(<SignupFlow />);

    expect(
      await screen.findByRole("heading", { name: "Mentor hesabını tamamla" }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Ad soyad/), "Çağrı Yılmaz");
    await user.type(screen.getByLabelText("Telefon"), "+905551112233");
    await user.click(
      screen.getByRole("button", { name: "Mentor profiline devam et" }),
    );

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
    expect(registerMentor).toHaveBeenCalledWith(
      expect.objectContaining({ programInvite: "abc123" }),
      "id-token",
    );
  });

  it("resumes an existing mentor without trying to register again", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "mentor");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "leyla@mentor.co",
      fullName: "Leyla Aksoy",
      verified: true,
    });
    vi.mocked(fetchAccountStatus).mockResolvedValue({
      id: "mentor-id",
      email: "leyla@mentor.co",
      fullName: "Leyla Aksoy",
      role: UserRole.Mentor,
    });

    render(<SignupFlow />);

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
    expect(registerMentor).not.toHaveBeenCalled();
  });

  it("takes a resumed mentor's name from the account instead of asking again", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "mentor");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "deniz@mentor.co",
      fullName: "",
      verified: true,
    });
    vi.mocked(fetchAccountStatus).mockResolvedValue({
      id: "mentor-id",
      email: "deniz@mentor.co",
      fullName: "Deniz Test",
      role: UserRole.Mentor,
    });

    render(<SignupFlow />);

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Mentor hesabını tamamla" }),
    ).not.toBeInTheDocument();
  });

  it("keeps an unverified restored account in the verification step", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentFirebaseAccount).mockResolvedValue({
      email: "gulse@dongu.co",
      fullName: "Gülse Yılmaz",
      verified: false,
    });

    render(<SignupFlow />);

    expect(
      await screen.findByText("gulse@dongu.co", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wizard")).not.toBeInTheDocument();
  });

  it("returns to the signed-out role page after Firebase confirms there is no session", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentFirebaseAccount).mockResolvedValue(null);

    render(<SignupFlow />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: ROLE_HEADING }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "Çıkış yap" }),
    ).not.toBeInTheDocument();
  });
});
