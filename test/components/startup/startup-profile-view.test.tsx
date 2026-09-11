import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProfileView } from "@/components/startup/startup-profile-view";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { useStartupStatusForm } from "@/hooks/use-startup-status-form";
import type { StartupProfile } from "@/interfaces/organization";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-overview", () => ({
  useStartupOverview: vi.fn(),
}));

vi.mock("@/hooks/use-startup-status-form", () => ({
  useStartupStatusForm: vi.fn(),
}));

vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
}));

const openDocument = vi.fn();
const openStatus = vi.fn();

const profile: StartupProfile = {
  id: "org-1",
  name: "Döngü",
  description: "Gönüllülerle sosyal girişimleri buluşturur.",
  website: null,
  problem: null,
  solution: null,
  currentSolution: null,
  targetUser: null,
  sector: null,
  maturity: "MVP yayında",
  programLevel: null,
  supportAreas: [],
  statusVersion: "v0.9.2",
  statusSummary: "Öğretmen modülü geliştirme aşamasında.",
  completionPercent: 72,
  createdAt: "2026-06-12T09:00:00Z",
  updatedAt: "2026-09-02T09:00:00Z",
};

function document(id: string, kind: DocumentKind): StartupDocument {
  return {
    id,
    kind,
    originalFilename: `${id}.pdf`,
    contentType: "application/pdf",
    sizeBytes: 1024,
    createdAt: "2026-09-02T12:00:00Z",
    uploadedById: "user-1",
    uploadedByName: "Gülse Buran",
    meetingId: null,
    meetingAgenda: null,
    meetingScheduledAt: null,
    shares: [],
  };
}

type Overview = ReturnType<typeof useStartupOverview>;

function overview(overrides: Partial<Overview> = {}): Overview {
  return {
    canvas: document("canvas-1", DocumentKind.Canvas),
    documentsLoading: false,
    error: null,
    isLoading: false,
    logoUrl: null,
    profile,
    sharedDocuments: [document("pitch-deck", DocumentKind.PitchDeck)],
    team: [
      {
        id: "u-1",
        email: "gulse@dongu.app",
        fullName: "Gülse Buran",
        role: "MENTEE",
        jobTitle: "Product Designer",
        founder: true,
      },
      {
        id: "u-2",
        email: "sude@dongu.app",
        fullName: "Sude Arya",
        role: "MENTEE",
        jobTitle: "Developer",
      },
    ],
    teamLoading: false,
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
  });

  it("shows the startup with its status and progress", () => {
    renderWithQueryClient(<StartupProfileView />);

    expect(screen.getByRole("heading", { name: "Döngü" })).toBeInTheDocument();
    expect(
      screen.getByText("Gönüllülerle sosyal girişimleri buluşturur."),
    ).toBeInTheDocument();
    expect(screen.getByText("MVP yayında")).toBeInTheDocument();
    expect(screen.getByText("v0.9.2")).toBeInTheDocument();
    expect(screen.getByText("%72 tamamlandı")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(
      screen.getByRole("link", { name: /Profili Düzenle/ }),
    ).toHaveAttribute("href", "/profile");
  });

  it("opens the canvas and shared files through a signed link", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProfileView />);

    const canvas = screen.getByRole("region", { name: "Canvas" });
    expect(
      within(canvas).getByText(/Son güncelleme: 2 Eylül 2026/),
    ).toBeInTheDocument();
    await user.click(within(canvas).getByRole("button", { name: "Görüntüle" }));
    await user.click(screen.getByRole("button", { name: /pitch-deck\.pdf/ }));

    expect(openDocument).toHaveBeenNthCalledWith(1, "canvas-1");
    expect(openDocument).toHaveBeenNthCalledWith(2, "pitch-deck");
  });

  it("labels the founder in the team preview", () => {
    renderWithQueryClient(<StartupProfileView />);

    const team = screen.getByRole("region", { name: "Ekip" });
    expect(
      within(team).getByText("Product Designer · Kurucu"),
    ).toBeInTheDocument();
    expect(within(team).getByText("Developer")).toBeInTheDocument();
  });

  it("opens the status form", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProfileView />);

    await user.click(screen.getByRole("button", { name: "Durumu güncelle" }));

    expect(openStatus).toHaveBeenCalled();
  });

  it("says what is missing instead of showing empty cards", () => {
    vi.mocked(useStartupOverview).mockReturnValue(
      overview({
        canvas: null,
        profile: {
          ...profile,
          maturity: null,
          statusVersion: null,
          statusSummary: null,
          completionPercent: null,
        },
        sharedDocuments: [],
        team: [],
      }),
    );

    renderWithQueryClient(<StartupProfileView />);

    expect(screen.getByText("Aşama belirtilmedi")).toBeInTheDocument();
    expect(
      screen.getByText("Henüz bir durum güncellemesi eklenmedi."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.getByText("Henüz bir kanvas yüklenmedi."),
    ).toBeInTheDocument();
    expect(screen.getByText("Henüz ekip üyesi eklenmedi.")).toBeInTheDocument();
    expect(
      screen.getByText("Henüz mentorlarla paylaşılan bir dosya yok."),
    ).toBeInTheDocument();
  });

  it("shows the logo once it is signed", () => {
    vi.mocked(useStartupOverview).mockReturnValue(
      overview({ logoUrl: "https://bucket.s3/logo.png?sig" }),
    );

    renderWithQueryClient(<StartupProfileView />);

    expect(screen.getByRole("img", { name: "Döngü logosu" })).toHaveStyle({
      backgroundImage: 'url("https://bucket.s3/logo.png?sig")',
    });
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
      screen.queryByRole("heading", { name: "Döngü" }),
    ).not.toBeInTheDocument();
  });
});
