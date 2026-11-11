import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProfileView } from "@/components/startup/startup-profile-view";
import { useViewerIsFounder } from "@/hooks/use-organization-members";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { useStartupStatusForm } from "@/hooks/use-startup-status-form";
import {
  StartupFundingStage,
  type StartupProfile,
} from "@/interfaces/organization";
import { UserAccountStatus } from "@/interfaces/session";
import { DocumentKind } from "@/interfaces/startup-document";
import { documentFixture } from "@test/fixtures/startup-files";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/startup/startup-page-frame", () => ({
  StartupPageFrame: ({
    action,
    children,
  }: {
    action?: ReactNode;
    children: ReactNode;
  }) => (
    <div>
      {action}
      {children}
    </div>
  ),
  startupPrimaryActionClass: "",
  startupSecondaryActionClass: "",
}));

vi.mock("@/hooks/use-startup-overview", () => ({
  useStartupOverview: vi.fn(),
}));

vi.mock("@/hooks/use-startup-status-form", () => ({
  useStartupStatusForm: vi.fn(),
}));

vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
}));

vi.mock("@/hooks/use-organization-members", () => ({
  useViewerIsFounder: vi.fn(),
}));

const openDocument = vi.fn();
const openStatus = vi.fn();

const profile: StartupProfile = {
  id: "org-1",
  name: "Döngü",
  description: "Gönüllülerle sosyal girişimleri buluşturur.",
  website: "dongu.app",
  problem: null,
  solution: null,
  currentSolution: null,
  targetUser: null,
  sector: "Sosyal etki · Gönüllülük",
  maturity: "MVP Hazır",
  programLevel: null,
  supportAreas: [],
  statusVersion: "v0.9.2",
  statusSummary: "Öğretmen modülü geliştirme aşamasında.",
  completionPercent: 72,
  fundingStage: StartupFundingStage.PreSeed,
  foundedYear: 2026,
  approvalStatus: UserAccountStatus.Approved,
  createdAt: "2026-06-12T09:00:00Z",
  updatedAt: "2026-09-02T09:00:00Z",
};

type Overview = ReturnType<typeof useStartupOverview>;

function overview(overrides: Partial<Overview> = {}): Overview {
  return {
    canvas: documentFixture("canvas-1", {
      kind: DocumentKind.Canvas,
      originalFilename: "dongu-canvas-v2.pdf",
      createdAt: "2026-09-02T12:00:00Z",
    }),
    documentsLoading: false,
    error: null,
    isLoading: false,
    mentorships: [
      {
        id: "r-1",
        mentorName: "Nihan Öztürk",
        supportArea: "Ürün konumlandırma",
        heldSessions: 3,
        plannedSessions: 6,
        nextMeetingAt: "2026-08-30T09:00:00Z",
      },
      {
        id: "r-2",
        mentorName: "Selin Kaya",
        supportArea: "Yatırım turu hazırlığı",
        heldSessions: 2,
        plannedSessions: null,
        nextMeetingAt: null,
      },
    ],
    mentorshipsLoading: false,
    profile,
    programName: "METU Stars 2026",
    stageName: "MVP",
    teamSize: 4,
    ...overrides,
  };
}

describe("StartupProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(openDocument);
    vi.mocked(useStartupStatusForm).mockReturnValue({
      close: vi.fn(),
      draft: { statusVersion: "", statusSummary: "", completionPercent: "" },
      error: null,
      isOpen: false,
      isSaving: false,
      open: openStatus,
      setField: vi.fn(),
      submit: vi.fn(),
    });
    vi.mocked(useStartupOverview).mockReturnValue(overview());
    vi.mocked(useViewerIsFounder).mockReturnValue(true);
  });

  it("shows a member the profile without the founder's edit controls", () => {
    vi.mocked(useViewerIsFounder).mockReturnValue(false);
    renderWithQueryClient(<StartupProfileView />);

    expect(
      screen.queryByRole("link", { name: "Profili düzenle" }),
    ).not.toBeInTheDocument();
    const about = screen.getByRole("region", { name: "Startup hakkında" });
    expect(within(about).queryByRole("link")).not.toBeInTheDocument();
    const status = screen.getByRole("region", { name: "Ürün durumu" });
    expect(
      within(status).queryByRole("button", { name: "Güncelle" }),
    ).not.toBeInTheDocument();
  });

  it("shows the description and the product status with its progress", () => {
    renderWithQueryClient(<StartupProfileView />);

    expect(
      screen.getByRole("link", { name: "Profili düzenle" }),
    ).toHaveAttribute("href", "/profile");
    const about = screen.getByRole("region", { name: "Startup hakkında" });
    expect(
      within(about).getByText("Gönüllülerle sosyal girişimleri buluşturur."),
    ).toBeInTheDocument();
    const status = screen.getByRole("region", { name: "Ürün durumu" });
    expect(within(status).getByText("MVP Hazır")).toBeInTheDocument();
    expect(
      within(status).getByText("v0.9.2 · son güncelleme 2 Eylül 2026"),
    ).toBeInTheDocument();
    expect(within(status).getByText("%72")).toBeInTheDocument();
    expect(within(status).getByText("MVP tamamlanma")).toBeInTheDocument();
    expect(within(status).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
  });

  it("fills the Künye from the profile, the program, the stage and the team", () => {
    renderWithQueryClient(<StartupProfileView />);

    const facts = screen.getByRole("region", { name: "Künye" });
    const value = (label: string) =>
      within(facts).getByText(label).nextElementSibling;
    expect(value("Kuruluş")).toHaveTextContent("2026");
    expect(value("Aşama")).toHaveTextContent("MVP · Pre-seed");
    expect(value("Sektör")).toHaveTextContent("Sosyal etki · Gönüllülük");
    expect(value("Program")).toHaveTextContent("METU Stars 2026");
    expect(value("Web")).toHaveTextContent("dongu.app");
    expect(value("Ekip")).toHaveTextContent("4 kişi");
  });

  it("lists active mentorships with their sessions and next meeting", () => {
    renderWithQueryClient(<StartupProfileView />);

    const mentorships = screen.getByRole("region", {
      name: "Aktif mentorlukların",
    });
    expect(
      within(mentorships).getByText(
        "Ürün konumlandırma · 3 / 6 seans · sonraki 30 Ağu",
      ),
    ).toBeInTheDocument();
    expect(
      within(mentorships).getByText("Yatırım turu hazırlığı · 2 seans"),
    ).toBeInTheDocument();
    expect(
      within(mentorships).getByRole("link", { name: "Mentorluklarım →" }),
    ).toHaveAttribute("href", "/mentorships");
  });

  it("opens the canvas through a signed link and the status form", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProfileView />);

    const canvas = screen.getByRole("region", {
      name: "Business Model Canvas",
    });
    expect(
      within(canvas).getByText("Son güncelleme 2 Eylül 2026 · Gülse Buran"),
    ).toBeInTheDocument();
    await user.click(within(canvas).getByRole("button", { name: "Görüntüle" }));
    await user.click(screen.getByRole("button", { name: "Güncelle" }));

    expect(openDocument).toHaveBeenCalledWith("canvas-1");
    expect(openStatus).toHaveBeenCalled();
  });

  it("says what is missing instead of showing empty cards", () => {
    vi.mocked(useStartupOverview).mockReturnValue(
      overview({
        canvas: null,
        mentorships: [],
        programName: null,
        stageName: null,
        teamSize: null,
        profile: {
          ...profile,
          description: null,
          maturity: null,
          statusSummary: null,
          completionPercent: null,
          fundingStage: null,
          foundedYear: null,
        },
      }),
    );

    renderWithQueryClient(<StartupProfileView />);

    expect(
      screen.getByText("Henüz bir tanıtım yazısı eklenmedi."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aşama belirtilmedi")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.getByText("Henüz bir kanvas yüklenmedi."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yükle →" })).toHaveAttribute(
      "href",
      "/startup/files",
    );
    expect(
      screen.getByText("Henüz aktif bir mentorluğun yok."),
    ).toBeInTheDocument();
    const facts = screen.getByRole("region", { name: "Künye" });
    expect(within(facts).getAllByText("—")).toHaveLength(4);
  });

  it("reports a profile that could not be loaded", () => {
    vi.mocked(useStartupOverview).mockReturnValue(
      overview({
        profile: null,
        error: new Error("Startup profili yüklenemedi."),
      }),
    );

    renderWithQueryClient(<StartupProfileView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Startup profili yüklenemedi.",
    );
  });

  it("waits for the profile before drawing the cards", () => {
    vi.mocked(useStartupOverview).mockReturnValue(
      overview({ isLoading: true, profile: null }),
    );

    renderWithQueryClient(<StartupProfileView />);

    expect(screen.getByText("Startup profili yükleniyor…")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Künye" }),
    ).not.toBeInTheDocument();
  });
});
