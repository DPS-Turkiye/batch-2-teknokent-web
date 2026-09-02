import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupFlow } from "@/components/signup/signup-flow";
import { currentUserEmail } from "@/lib/firebase/auth";

const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn(),
  currentUserEmail: vi.fn(),
  currentIdToken: vi.fn(),
  isCurrentEmailVerified: () => true,
  describeAuthError: () => "Kimlik doğrulama tamamlanamadı.",
}));

vi.mock("@/lib/client/auth", () => ({ registerMentor: vi.fn() }));

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
});

describe("SignupFlow resume", () => {
  it("shows the account form normally", () => {
    vi.mocked(currentUserEmail).mockReturnValue(null);
    render(<SignupFlow />);
    expect(screen.queryByTestId("wizard")).not.toBeInTheDocument();
  });

  it("skips the account form when resuming an interrupted signup", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentUserEmail).mockReturnValue("gulse@dongu.co");

    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: "Kaydını nasıl tamamlayacaksın?" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wizard")).not.toBeInTheDocument();
  });

  it("opens the startup wizard after the resume picker chooses startup", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentUserEmail).mockReturnValue("gulse@dongu.co");

    render(<SignupFlow />);
    await userEvent.click(
      screen.getByRole("button", { name: "Startup olarak devam et" }),
    );

    expect(await screen.findByTestId("wizard")).toHaveTextContent(
      "gulse@dongu.co",
    );
  });

  it("opens mentor onboarding after the resume picker chooses mentor", async () => {
    searchParams.set("resume", "1");
    vi.mocked(currentUserEmail).mockReturnValue("leyla@mentor.co");

    render(<SignupFlow />);
    await userEvent.click(
      screen.getByRole("button", { name: "Mentor olarak devam et" }),
    );

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
  });

  it("resumes mentor onboarding when the URL already says mentor", async () => {
    searchParams.set("resume", "1");
    searchParams.set("role", "mentor");
    vi.mocked(currentUserEmail).mockReturnValue("leyla@mentor.co");

    render(<SignupFlow />);

    expect(await screen.findByTestId("mentor-onboarding")).toBeInTheDocument();
  });

  it("does not resume when Firebase has no signed-in user", () => {
    searchParams.set("resume", "1");
    vi.mocked(currentUserEmail).mockReturnValue(null);

    render(<SignupFlow />);

    expect(screen.queryByTestId("wizard")).not.toBeInTheDocument();
  });

  it("ignores the resume flag without it being set, even when signed in", async () => {
    vi.mocked(currentUserEmail).mockReturnValue("gulse@dongu.co");

    render(<SignupFlow />);

    await waitFor(() =>
      expect(screen.queryByTestId("wizard")).not.toBeInTheDocument(),
    );
  });
});
