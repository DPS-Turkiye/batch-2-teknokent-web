import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupFlow } from "@/components/signup/signup-flow";
import { UserRole } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { fetchAccountStatus, registerMentor } from "@/lib/client/auth";
import { currentFirebaseAccount } from "@/lib/firebase/auth";

const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

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
  vi.mocked(currentFirebaseAccount).mockResolvedValue(null);
  vi.mocked(registerMentor).mockResolvedValue({} as never);
});

describe("SignupFlow resume", () => {
  it("shows the account form normally", () => {
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: "Startup'ınla METUal'a katıl" }),
    ).toBeInTheDocument();
    expect(currentFirebaseAccount).not.toHaveBeenCalled();
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
      await screen.findByRole("heading", {
        name: "Kaydını nasıl tamamlayacaksın?",
      }),
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
      await screen.findByRole("button", { name: "Startup olarak devam et" }),
    );

    expect(await screen.findByTestId("wizard")).toHaveTextContent(
      "gulse@dongu.co",
    );
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

  it("returns to the account form after Firebase confirms there is no session", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentFirebaseAccount).mockResolvedValue(null);

    render(<SignupFlow />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Startup'ınla METUal'a katıl" }),
      ).toBeInTheDocument(),
    );
  });
});
