import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { StartupProfileImport } from "@/components/startup/startup-profile-import";
import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { BackendErrorCode } from "@/interfaces/ai-features";
import {
  ProfileAnalysisStatus,
  ProfileAnalysisType,
} from "@/interfaces/profile-analysis";
import { UserRole, type AppSession } from "@/interfaces/session";
import { isAiFeatureDisabledError } from "@/lib/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { uploadProfileAnalysis } from "@/lib/client/profile-analysis";
import {
  confirmStartupProfileRecord,
  createStartupProfileRecord,
  getProfileAnalysisRecord,
} from "@/lib/client/profile-analysis-records";
import { aiFeatures } from "@test/fixtures/ai-features";
import { analysis, profileToolsWrapper } from "@test/fixtures/profile-tools";

vi.mock("@/hooks/use-ai-features", () => ({
  useAiFeatures: vi.fn(),
  useAiFeatureRefusal: vi.fn(),
}));

/** What a screen does with a failure; a switched-off refusal answers true. */
const refused = vi.fn((error: unknown) => isAiFeatureDisabledError(error));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis-records", () => ({
  getProfileAnalysisRecord: vi.fn(),
  createStartupProfileRecord: vi.fn(),
  confirmStartupProfileRecord: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis", () => ({
  uploadProfileAnalysis: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
  vi.mocked(useAiFeatureRefusal).mockReturnValue(refused);
  vi.mocked(useAppSession).mockReturnValue({
    role: UserRole.Mentee,
    userId: "me",
    organizationId: "team",
  } as AppSession);
  vi.mocked(getProfileAnalysisRecord).mockRejectedValue(
    new ClientApiError("Not found", 404),
  );
  vi.mocked(uploadProfileAnalysis).mockResolvedValue(analysis());
  vi.mocked(confirmStartupProfileRecord).mockResolvedValue(
    analysis({ status: ProfileAnalysisStatus.Confirmed }),
  );
  vi.mocked(createStartupProfileRecord).mockResolvedValue(
    analysis({ status: ProfileAnalysisStatus.Confirmed }),
  );
});
function setup(locale: "en" | "tr" = "en") {
  const { client, Wrapper } = profileToolsWrapper(locale);
  return {
    client,
    user: userEvent.setup(),
    ...render(<StartupProfileImport />, { wrapper: Wrapper }),
  };
}
describe("embedded startup profile import", () => {
  it("treats a missing previous analysis as empty and offers no personal/team selector", async () => {
    setup();
    expect(await screen.findByText(/No startup profile/)).toBeInTheDocument();
    expect(screen.queryByText("Personal CV")).not.toBeInTheDocument();
    expect(screen.queryByText("Who is it for?")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("requires consent, extracts a startup-scoped draft, reviews it and preserves its other evidence on confirmation", async () => {
    const { user } = setup();
    const file = new File(["%PDF-data"], "pitch.pdf", {
      type: "application/pdf",
    });
    const extract = screen.getByRole("button", { name: "Extract profile" });
    expect(extract).toBeDisabled();
    await user.upload(screen.getByLabelText("Choose a pitch deck"), file);
    expect(extract).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(extract);
    expect(uploadProfileAnalysis).toHaveBeenCalledWith({
      file,
      profileType: "mentee",
      ocrMode: "auto",
      consentAccepted: true,
    });
    await screen.findByRole("heading", { name: /Review/ });
    await user.clear(screen.getByLabelText("Technologies (comma-separated)"));
    await user.type(
      screen.getByLabelText("Technologies (comma-separated)"),
      "Java",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm and save profile" }),
    );
    await waitFor(() =>
      expect(confirmStartupProfileRecord).toHaveBeenCalledWith(
        "analysis-1",
        expect.objectContaining({
          technologies: ["Java"],
          technology_inferences: [],
          support_needs: ["Sales"],
        }),
      ),
    );
    await screen.findByText("Profile confirmed and ready for matching.");
  });
  it("retains the selected file and consent after upload failure so retry works", async () => {
    vi.mocked(uploadProfileAnalysis).mockRejectedValueOnce(
      new Error("offline"),
    );
    const { user } = setup();
    const file = new File(["pdf"], "pitch.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Choose a pitch deck"), file);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Extract profile" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Extract profile" }));
    await screen.findByRole("heading", { name: /Review/ });
    expect(uploadProfileAnalysis).toHaveBeenCalledTimes(2);
  });
  it("offers only the manual profile when deck reading is switched off", async () => {
    vi.mocked(useAiFeatures).mockReturnValue(
      aiFeatures({ profileParsing: false }),
    );
    setup();

    expect(
      await screen.findByText(
        "Decks are not read automatically on this system; fill in the startup profile below by hand.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Choose a pitch deck")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Extract profile" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Confirm and save manual profile" }),
    ).toBeInTheDocument();
  });

  it("opens the manual profile when the backend refuses a switched-off read", async () => {
    vi.mocked(uploadProfileAnalysis).mockRejectedValueOnce(
      new ClientApiError("off", 403, BackendErrorCode.AiFeatureDisabled),
    );
    const { user } = setup();
    const file = new File(["pdf"], "pitch.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Choose a pitch deck"), file);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Extract profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Decks are not read automatically on this system",
    );
    expect(
      screen.getByRole("button", { name: "Close the manual form" }),
    ).toBeInTheDocument();
  });

  it("validates manual minimum input and creates a startup matching profile without a person id", async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Enter the details without a PDF" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm and save manual profile" }),
    );
    expect(
      await screen.findByText("Enter a startup name or summary."),
    ).toBeInTheDocument();
    expect(createStartupProfileRecord).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Startup name"), "Launch");
    await user.click(
      screen.getByRole("button", { name: "Confirm and save manual profile" }),
    );
    await waitFor(() =>
      expect(createStartupProfileRecord).toHaveBeenCalledWith(
        expect.objectContaining({ startup_name: "Launch" }),
      ),
    );
    expect(
      screen.queryByRole("heading", { name: "Create the profile manually" }),
    ).not.toBeInTheDocument();
  });
  it("shows a retriable loading error instead of treating a server failure as an empty profile", async () => {
    vi.mocked(getProfileAnalysisRecord)
      .mockRejectedValueOnce(new ClientApiError("Unavailable", 503))
      .mockResolvedValue(analysis({ status: ProfileAnalysisStatus.Confirmed }));
    const { user } = setup();
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Profile confirmed and ready for matching.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("does not put a historical personal CV in the startup review form", async () => {
    vi.mocked(getProfileAnalysisRecord).mockResolvedValue(
      analysis({ profileType: ProfileAnalysisType.Personal }),
    );
    setup();
    await screen.findByText(/No startup profile/);
    expect(screen.queryByText("startup.pdf")).not.toBeInTheDocument();
  });
});
