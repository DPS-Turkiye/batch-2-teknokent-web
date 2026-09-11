import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupFilesView } from "@/components/startup/startup-files-view";
import { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  meetingFiles,
  sharedFileRows,
  StartupFileFilter,
  startupFiles,
} from "@/lib/startup-files";
import { documentFixture } from "@test/fixtures/startup-files";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-files", () => ({ useStartupFiles: vi.fn() }));
vi.mock("@/hooks/use-file-upload-form", () => ({ useFileUploadForm: vi.fn() }));
vi.mock("@/hooks/use-startup-documents", () => ({ useOpenDocument: vi.fn() }));

const deck = documentFixture("Pitch_Deck_v3", {
  shares: [
    {
      mentorId: "m-1",
      mentorName: "Nihan Öztürk",
      sharedAt: "2026-09-05T09:00:00Z",
    },
  ],
});
const meetingFile = documentFixture("mvp-notes", {
  kind: DocumentKind.MeetingFile,
  meetingId: "meeting-1",
  meetingAgenda: "MVP Scope & User Flow",
  meetingScheduledAt: "2026-08-18T09:00:00Z",
});
const documents = [deck, meetingFile];

type Files = ReturnType<typeof useStartupFiles>;

function state(overrides: Partial<Files> = {}): Files {
  return {
    askDelete: vi.fn(),
    cancelDelete: vi.fn(),
    closeShare: vi.fn(),
    confirmDelete: vi.fn(),
    deletingDocument: null,
    error: null,
    filter: StartupFileFilter.All,
    isDeleting: false,
    isLoading: false,
    isSharing: false,
    mentors: [],
    openShare: vi.fn(),
    sections: {
      meeting: meetingFiles(documents),
      shared: sharedFileRows(documents),
      startup: startupFiles(documents),
    },
    setFilter: vi.fn(),
    shareWith: vi.fn(),
    sharingDocument: null,
    stopSharing: vi.fn(),
    ...overrides,
  };
}

const uploadForm = { isOpen: false, open: vi.fn() } as unknown as ReturnType<
  typeof useFileUploadForm
>;

describe("StartupFilesView", () => {
  const openDocument = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(openDocument);
    vi.mocked(useFileUploadForm).mockReturnValue(uploadForm);
  });

  it("shows the three lists with their details", () => {
    vi.mocked(useStartupFiles).mockReturnValue(state());
    renderWithQueryClient(<StartupFilesView />);

    const own = screen.getByRole("region", { name: "Startup Dosyalarım" });
    expect(within(own).getByText("Pitch_Deck_v3.pdf")).toBeInTheDocument();
    expect(
      within(own).getByText("PDF · 2.3 MB · 12 Eyl 2026"),
    ).toBeInTheDocument();

    const shared = screen.getByRole("region", {
      name: "Mentorlarla Paylaşılan Dosyalar",
    });
    expect(within(shared).getByText(/Nihan Öztürk/)).toBeInTheDocument();
    expect(within(shared).getByText("Paylaşıldı")).toBeInTheDocument();

    const meetings = screen.getByRole("region", { name: "Toplantı Dosyaları" });
    expect(
      within(meetings).getByText("MVP Scope & User Flow"),
    ).toBeInTheDocument();
    expect(within(meetings).getByText("18 Ağustos 2026")).toBeInTheDocument();
  });

  it("shows only the chosen list and changes the filter", async () => {
    const user = userEvent.setup();
    const files = state({ filter: StartupFileFilter.Meeting });
    vi.mocked(useStartupFiles).mockReturnValue(files);
    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getByRole("button", { name: "Toplantı" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("region", { name: "Startup Dosyalarım" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Toplantı Dosyaları" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Profil" }));
    expect(files.setFilter).toHaveBeenCalledWith(StartupFileFilter.Profile);
  });

  it("opens, shares and deletes from a file's menu", async () => {
    const user = userEvent.setup();
    const files = state();
    vi.mocked(useStartupFiles).mockReturnValue(files);
    renderWithQueryClient(<StartupFilesView />);

    const menu = screen.getByRole("button", {
      name: "Pitch_Deck_v3.pdf işlemleri",
    });
    await user.click(menu);
    await user.click(screen.getByRole("menuitem", { name: "Görüntüle" }));
    expect(openDocument).toHaveBeenCalledWith("Pitch_Deck_v3");

    await user.click(menu);
    await user.click(screen.getByRole("menuitem", { name: "Mentorla paylaş" }));
    expect(files.openShare).toHaveBeenCalledWith("Pitch_Deck_v3");

    await user.click(menu);
    await user.click(screen.getByRole("menuitem", { name: "Sil" }));
    expect(files.askDelete).toHaveBeenCalledWith("Pitch_Deck_v3");
  });

  it("opens the upload dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(useStartupFiles).mockReturnValue(state());
    renderWithQueryClient(<StartupFilesView />);

    await user.click(screen.getByRole("button", { name: "Dosya Yükle" }));
    expect(uploadForm.open).toHaveBeenCalled();
  });

  it("says so when there are no files yet", () => {
    vi.mocked(useStartupFiles).mockReturnValue(
      state({ sections: { meeting: [], shared: [], startup: [] } }),
    );
    renderWithQueryClient(<StartupFilesView />);

    expect(
      screen.getByText("Henüz bir startup dosyası yüklenmedi."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Henüz mentorlarla paylaşılan bir dosya yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Henüz bir toplantı dosyası yok."),
    ).toBeInTheDocument();
  });
});
