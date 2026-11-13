import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalProfileStep } from "@/components/signup/steps/personal-profile-step";
import { useSignupCv } from "@/hooks/use-signup-cv";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import { signupWizardStub } from "@test/fixtures/signup-wizard";
import { InLocale } from "@test/test-utils";

vi.mock("@/hooks/use-signup-cv", () => ({ useSignupCv: vi.fn() }));
vi.mock("@/hooks/use-stored-documents", () => ({
  useStoredDocuments: vi.fn(),
}));

type SignupCv = ReturnType<typeof useSignupCv>;

function mockCv(overrides: Partial<SignupCv> = {}) {
  vi.mocked(useSignupCv).mockReturnValue({
    choose: vi.fn<SignupCv["choose"]>(),
    canRead: true,
    consent: false,
    setConsent: vi.fn<SignupCv["setConsent"]>(),
    isReading: false,
    error: null,
    ...overrides,
  });
}

function renderStep() {
  return render(
    <InLocale locale="tr">
      <PersonalProfileStep wizard={signupWizardStub()} />
    </InLocale>,
  );
}

const MANUAL =
  "Bu sistemde CV otomatik okunmuyor; dosyan yalnızca kaydedilir. Bilgilerini yukarıya kendin gir.";

describe("PersonalProfileStep CV card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStoredDocuments).mockReturnValue({
      byKind: () => null,
      isLoading: false,
    });
  });

  it("says the CV is being read while it is", () => {
    mockCv({ isReading: true });
    renderStep();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(MANUAL)).toBeNull();
  });

  it("points to the manual fields when CV reading is switched off", () => {
    mockCv({ canRead: false });
    renderStep();

    expect(screen.getByText(MANUAL)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("asks for the reading consent with an unticked box and hands a tick to the hook", async () => {
    const setConsent = vi.fn<SignupCv["setConsent"]>();
    mockCv({ setConsent });
    renderStep();

    const box = screen.getByRole("checkbox", { name: /CV'min okunmasını/ });
    expect(box).not.toBeChecked();
    await userEvent.click(box);

    expect(setConsent).toHaveBeenCalledWith(true);
  });

  it("shows why a CV could not be read", () => {
    mockCv({ error: "Bu yapay zekâ özelliği bu sistemde kapalı." });
    renderStep();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu yapay zekâ özelliği bu sistemde kapalı.",
    );
  });
});
