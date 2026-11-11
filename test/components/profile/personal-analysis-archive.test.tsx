import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalAnalysisArchive } from "@/components/profile/personal-analysis-archive";
import { useAppSession } from "@/components/providers/session-provider";
import {
  ProfileAnalysisRecordScope,
  ProfileAnalysisStatus,
  ProfileAnalysisType,
} from "@/interfaces/profile-analysis";
import { UserRole, type AppSession } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { getProfileAnalysisRecord } from "@/lib/client/profile-analysis-records";
import { analysis, profileToolsWrapper } from "@test/fixtures/profile-tools";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis-records", () => ({
  getProfileAnalysisRecord: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAppSession).mockReturnValue({
    role: UserRole.Mentee,
    userId: "me",
    organizationId: "team",
  } as AppSession);
});
function setup(locale: "en" | "tr" = "en") {
  const { Wrapper } = profileToolsWrapper(locale);
  return render(<PersonalAnalysisArchive />, { wrapper: Wrapper });
}
const personal = () =>
  analysis({
    profileType: ProfileAnalysisType.Personal,
    sourceFilename: "earlier-cv.pdf",
    status: ProfileAnalysisStatus.Confirmed,
    profile: JSON.stringify({
      professional_summary: "Prior career summary",
      technologies: ["Java"],
    }),
  });
describe("previous personal analysis in the modern feature", () => {
  it("keeps an earlier team-stored CV readable without applying it to the user", async () => {
    vi.mocked(getProfileAnalysisRecord).mockImplementation(async (scope) => {
      if (scope === ProfileAnalysisRecordScope.Personal)
        throw new ClientApiError("Missing", 404);
      return personal();
    });
    setup();
    expect(await screen.findByText("Prior career summary")).toBeInTheDocument();
    expect(
      screen.getByText(/has not been applied to your personal profile/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("prefers the user's own CV analysis over the team archive", async () => {
    vi.mocked(getProfileAnalysisRecord).mockImplementation(async (scope) =>
      personalWithName(
        scope === ProfileAnalysisRecordScope.Personal ? "own.pdf" : "team.pdf",
      ),
    );
    setup();
    await screen.findByText("own.pdf");
    expect(screen.queryByText("team.pdf")).not.toBeInTheDocument();
  });
  it("offers retry for errors without claiming that saved data is missing", async () => {
    vi.mocked(getProfileAnalysisRecord)
      .mockRejectedValueOnce(new ClientApiError("Offline", 503))
      .mockResolvedValue(personal());
    const user = userEvent.setup();
    setup();
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Prior career summary");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("does not read or show team data for a mentor", async () => {
    vi.mocked(useAppSession).mockReturnValue({
      role: UserRole.Mentor,
    } as AppSession);
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
    expect(getProfileAnalysisRecord).not.toHaveBeenCalled();
  });
});
function personalWithName(sourceFilename: string) {
  return { ...personal(), sourceFilename };
}
