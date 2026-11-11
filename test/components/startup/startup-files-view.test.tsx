import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupFilesView } from "@/components/startup/startup-files-view";
import { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  StartupFileFilter,
  StartupFileStatus,
  type StartupFileRow,
} from "@/lib/startup-files";
import tr from "@/messages/tr.json";
import { documentRequestItem } from "@test/fixtures/document-requests";
import { expectLength } from "@test/fixtures/list-assertions";
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
vi.mock("@/hooks/use-startup-files", () => ({ useStartupFiles: vi.fn() }));
vi.mock("@/hooks/use-file-upload-form", () => ({ useFileUploadForm: vi.fn() }));
vi.mock("@/hooks/use-startup-documents", () => ({ useOpenDocument: vi.fn() }));

const deck = documentFixture("Pitch_Deck_v3");

const rows: StartupFileRow[] = [
  {
    key: "document:Pitch_Deck_v3",
    filters: [StartupFileFilter.Startup],
    title: "Pitch_Deck_v3.pdf",
    sizeBytes: 2_400_000,
    documentId: "Pitch_Deck_v3",
    source: "Gülse Buran yükledi",
    related: "Startup dokümanı",
    date: "2026-09-12T12:00:00Z",
    status: StartupFileStatus.Current,
    ownDocument: deck,
  },
  {
    key: "request:deck",
    filters: [StartupFileFilter.Program, StartupFileFilter.Pending],
    title: "pitch-deck-v3.pdf",
    sizeBytes: null,
    documentId: null,
    source: "METU Stars istedi",
    related: "Demo Day hazırlığı",
    date: "2026-08-20T09:00:00Z",
    status: StartupFileStatus.Waiting,
    ownDocument: null,
    pendingRequest: documentRequestItem("deck-request", {
      title: "pitch-deck-v3.pdf",
    }),
  },
  {
    key: "document:notes",
    filters: [StartupFileFilter.Mentorship],
    title: "arastirma-notlari.pdf",
    sizeBytes: 820_000,
    documentId: "notes",
    source: "Nihan Öztürk paylaştı",
    related: "Ürün konumlandırma · 16 Ağu görüşmesi",
    date: "2026-08-16T09:00:00Z",
    status: StartupFileStatus.FromMentor,
    ownDocument: null,
  },
];

type Files = ReturnType<typeof useStartupFiles>;

function state(overrides: Partial<Files> = {}): Files {
  return {
    askDelete: vi.fn(),
    cancelDelete: vi.fn(),
    closeShare: vi.fn(),
    confirmDelete: vi.fn(),
    counts: {
      [StartupFileFilter.All]: 3,
      [StartupFileFilter.Mentorship]: 1,
      [StartupFileFilter.Program]: 1,
      [StartupFileFilter.Startup]: 1,
      [StartupFileFilter.Pending]: 1,
    },
    deletingDocument: null,
    error: null,
    filter: StartupFileFilter.All,
    filterLabel: (filter: StartupFileFilter) => tr.startupFiles.filters[filter],
    isDeleting: false,
    isLoading: false,
    isSharing: false,
    mentors: [],
    openShare: vi.fn(),
    pendingNotice:
      "“pitch-deck-v3.pdf” METU Stars tarafından talep edildi, henüz yüklenmedi. Son tarih 28 Ağustos 2026.",
    rows,
    setFilter: vi.fn(),
    shareWith: vi.fn(),
    sharingDocument: null,
    stopSharing: vi.fn(),
    uploadForRequest: vi.fn(),
    uploadingRequestId: undefined,
    ...overrides,
  };
}

const uploadForm: ReturnType<typeof useFileUploadForm> = {
  canSubmit: false,
  close: vi.fn(),
  file: null,
  isOpen: false,
  isUploading: false,
  kind: DocumentKind.PitchDeck,
  open: vi.fn(),
  setFile: vi.fn(),
  setKind: vi.fn(),
  submit: vi.fn(),
};

describe("StartupFilesView", () => {
  const openDocument = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(openDocument);
    vi.mocked(useFileUploadForm).mockReturnValue(uploadForm);
    vi.mocked(useStartupFiles).mockReturnValue(state());
  });

  it("shows every file with its source, context, date and status", () => {
    renderWithQueryClient(<StartupFilesView />);

    const rows = screen.getAllByRole("row");
    expectLength(rows, 4);
    const [, own, pending, fromMentor] = rows;
    expect(within(own).getByText("Pitch_Deck_v3.pdf")).toBeInTheDocument();
    expect(within(own).getByText("2.3 MB")).toBeInTheDocument();
    expect(within(own).getByText("Gülse Buran yükledi")).toBeInTheDocument();
    expect(within(own).getByText("Startup dokümanı")).toBeInTheDocument();
    expect(within(own).getByText("12 Eyl")).toBeInTheDocument();
    expect(within(own).getByText("Güncel")).toBeInTheDocument();
    expect(within(pending).getByText("Henüz yüklenmedi")).toBeInTheDocument();
    expect(within(pending).getByText("Bekliyor")).toBeInTheDocument();
    expect(within(fromMentor).getByText("Mentordan geldi")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Son tarih 28 Ağustos 2026.",
    );
  });

  it("marks the chosen filter with its count and changes it", async () => {
    const user = userEvent.setup();
    const files = state();
    vi.mocked(useStartupFiles).mockReturnValue(files);
    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getByRole("button", { name: "Tümü (3)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(
      screen.getByRole("button", { name: "Bekleyen talep (1)" }),
    );

    expect(files.setFilter).toHaveBeenCalledWith(StartupFileFilter.Pending);
  });

  it("opens an uploaded file from its name but not a file still to come", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupFilesView />);

    await user.click(
      screen.getByRole("button", { name: "arastirma-notlari.pdf" }),
    );

    expect(openDocument).toHaveBeenCalledWith("notes");
    expect(
      screen.queryByRole("button", { name: "pitch-deck-v3.pdf" }),
    ).not.toBeInTheDocument();
  });

  it("opens, shares and deletes only the startup's own files from their menu", async () => {
    const user = userEvent.setup();
    const files = state();
    vi.mocked(useStartupFiles).mockReturnValue(files);
    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getAllByRole("button", { name: /işlemleri$/ })).toHaveLength(
      1,
    );
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

  it("uploads a file for a request that is still waiting", async () => {
    const user = userEvent.setup();
    const files = state();
    vi.mocked(useStartupFiles).mockReturnValue(files);
    const file = new File(["deck"], "deck.pdf", { type: "application/pdf" });
    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getAllByText("Yükle")).toHaveLength(1);
    await user.upload(screen.getByLabelText("pitch-deck-v3.pdf yükle"), file);

    expect(files.uploadForRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: "deck-request" }),
      file,
    );
  });

  it("opens the upload dialog", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupFilesView />);

    await user.click(screen.getByRole("button", { name: "Dosya yükle" }));

    expect(uploadForm.open).toHaveBeenCalled();
  });

  it("says so when a filter has no files and nothing is pending", () => {
    vi.mocked(useStartupFiles).mockReturnValue(
      state({ rows: [], pendingNotice: null }),
    );

    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getByText("Bu filtrede dosya yok.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes a file menu on Escape and on a click outside", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupFilesView />);
    const trigger = screen.getByRole("button", {
      name: "Pitch_Deck_v3.pdf işlemleri",
    });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("columnheader", { name: "Dosya" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("reports files that could not be loaded", () => {
    vi.mocked(useStartupFiles).mockReturnValue(
      state({ error: new Error("Startup dosyaları yüklenemedi.") }),
    );

    renderWithQueryClient(<StartupFilesView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Startup dosyaları yüklenemedi.",
    );
  });
});
