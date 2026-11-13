import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerMentorDocumentsStep } from "@/components/student/peer-mentor-documents-step";
import {
  PeerDocumentVisibility,
  PeerEvidenceType,
  type PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  addPeerMentorLink,
  deletePeerMentorDocument,
  getOwnPeerMentorDocuments,
  updatePeerMentorDocumentVisibility,
  uploadPeerMentorDocument,
} from "@/lib/client/peer-mentor-documents";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/peer-mentor-documents", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/client/peer-mentor-documents")
  >()),
  getOwnPeerMentorDocuments: vi.fn(),
  uploadPeerMentorDocument: vi.fn(),
  addPeerMentorLink: vi.fn(),
  updatePeerMentorDocumentVisibility: vi.fn(),
  deletePeerMentorDocument: vi.fn(),
}));

let stored: PeerMentorDocument[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  stored = [];
  vi.mocked(getOwnPeerMentorDocuments).mockImplementation(async () => [
    ...stored,
  ]);
  vi.mocked(uploadPeerMentorDocument).mockImplementation(
    async (file, evidenceType, visibility) => {
      const document = peerFileFixture({
        id: `doc-${stored.length + 1}`,
        originalFilename: file.name,
        evidenceType,
        visibility,
      });
      stored.push(document);
      return document;
    },
  );
  vi.mocked(addPeerMentorLink).mockImplementation(async (input) => {
    const link = peerLinkFixture({ id: `link-${stored.length + 1}`, ...input });
    stored.push(link);
    return link;
  });
  vi.mocked(updatePeerMentorDocumentVisibility).mockImplementation(
    async (id, visibility) => {
      stored = stored.map((item) =>
        item.id === id ? { ...item, visibility } : item,
      );
      const changed = stored.find((item) => item.id === id);
      if (!changed) throw new Error("missing");
      return changed;
    },
  );
  vi.mocked(deletePeerMentorDocument).mockImplementation(async (id) => {
    stored = stored.filter((item) => item.id !== id);
  });
});

function renderStep(
  topics: PeerTopicCategory[] = [
    PeerTopicCategory.AcademicDevelopment,
    PeerTopicCategory.CareerInternship,
  ],
  onLinkedinChange = vi.fn(),
) {
  renderWithQueryClient(
    <PeerMentorDocumentsStep
      topics={topics}
      linkedinUrl=""
      onLinkedinChange={onLinkedinChange}
    />,
  );
  return { onLinkedinChange };
}

const pdf = (name: string) =>
  new File(["%PDF-1.4"], name, { type: "application/pdf" });

describe("PeerMentorDocumentsStep", () => {
  it("asks for the documents the chosen categories require and counts them as they arrive", async () => {
    const user = userEvent.setup();
    renderStep();

    const transcript = await screen.findByRole("region", {
      name: "Öğrenci belgesi veya transkript",
    });
    expect(screen.getByText("0 / 2 zorunlu belge yüklendi")).toBeVisible();
    expect(
      screen.getByText(
        "Akademik Gelişim için Öğrenci belgesi veya transkript · Kariyer ve Staj için CV",
      ),
    ).toBeVisible();
    expect(within(transcript).getByText("Zorunlu")).toBeVisible();
    expect(
      within(
        screen.getByRole("region", { name: "Lisans veya sertifika" }),
      ).getByText("Opsiyonel"),
    ).toBeVisible();

    await user.upload(
      within(transcript).getByLabelText("dosya seç"),
      pdf("Transkript_2026_Guz.pdf"),
    );

    expect(await within(transcript).findByText("Yüklendi")).toBeVisible();
    expect(screen.getByText("1 / 2 zorunlu belge yüklendi")).toBeVisible();
    expect(
      within(transcript).getByRole("link", {
        name: "Transkript_2026_Guz.pdf dosyasını görüntüle",
      }),
    ).toHaveAttribute("href", "/api/peer-mentoring/documents/doc-1/content");
    expect(uploadPeerMentorDocument).toHaveBeenCalledWith(
      expect.any(File),
      PeerEvidenceType.Transcript,
      PeerDocumentVisibility.VerificationOnly,
    );
  });

  it("refuses a file that is not a PDF or too large before uploading", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderStep();
    const cv = await screen.findByRole("region", { name: "CV" });

    await user.upload(
      within(cv).getByLabelText("dosya seç"),
      new File(["x"], "cv.docx"),
    );
    expect(within(cv).getByRole("alert")).toHaveTextContent(
      "Yalnızca PDF dosyası yükleyebilirsin.",
    );

    const huge = pdf("cv.pdf");
    Object.defineProperty(huge, "size", { value: 11 * 1024 * 1024 });
    await user.upload(within(cv).getByLabelText("dosya seç"), huge);
    expect(within(cv).getByRole("alert")).toHaveTextContent(
      "Dosya en fazla 10 MB olabilir.",
    );
    expect(uploadPeerMentorDocument).not.toHaveBeenCalled();
  });

  it("uploads other materials as the picked kind and removes a file", async () => {
    const user = userEvent.setup();
    renderStep([]);
    const other = await screen.findByRole("region", {
      name: "Diğer materyaller",
    });
    expect(screen.getByText(/zorunlu belge yok/)).toBeVisible();

    await user.click(
      within(other).getByRole("radio", { name: "Gönüllülük belgesi" }),
    );
    await user.upload(
      within(other).getByLabelText("dosya seç"),
      pdf("Gonulluluk.pdf"),
    );

    expect(await within(other).findByText("Gonulluluk.pdf")).toBeVisible();
    expect(uploadPeerMentorDocument).toHaveBeenCalledWith(
      expect.any(File),
      PeerEvidenceType.Volunteering,
      PeerDocumentVisibility.VerificationOnly,
    );
    expect(
      within(other).getByRole("button", { name: "Materyal ekle" }),
    ).toBeVisible();

    await user.click(
      within(other).getByRole("button", {
        name: "Gonulluluk.pdf dosyasını kaldır",
      }),
    );
    await waitFor(() =>
      expect(within(other).queryByText("Gonulluluk.pdf")).toBeNull(),
    );
    expect(deletePeerMentorDocument).toHaveBeenCalledWith("doc-1");
  });

  it("changes who sees every file on a card", async () => {
    const user = userEvent.setup();
    stored = [
      peerFileFixture({ id: "cv-1", evidenceType: PeerEvidenceType.Cv }),
    ];
    renderStep();
    const cv = await screen.findByRole("region", { name: "CV" });
    await within(cv).findByText("Transkript_2026_Guz.pdf");

    await user.selectOptions(
      within(cv).getByRole("combobox", { name: "CV: kim görsün?" }),
      "Profilimde göster",
    );

    await waitFor(() =>
      expect(updatePeerMentorDocumentVisibility).toHaveBeenCalledWith(
        "cv-1",
        PeerDocumentVisibility.Profile,
      ),
    );
    expect(
      within(cv).getByRole("combobox", { name: "CV: kim görsün?" }),
    ).toHaveValue(PeerDocumentVisibility.Profile);
  });

  it("adds a portfolio link on Enter, refuses one that is not a web address, and passes LinkedIn up", async () => {
    const user = userEvent.setup();
    const { onLinkedinChange } = renderStep([
      PeerTopicCategory.TechnicalDigital,
    ]);
    const portfolio = await screen.findByRole("region", {
      name: "Portfolyo ve bağlantılar",
    });

    await user.type(within(portfolio).getByLabelText("LinkedIn"), "h");
    expect(onLinkedinChange).toHaveBeenCalledWith("h");

    const field = within(portfolio).getByLabelText(
      "Portfolyo veya proje bağlantısı",
    );
    await user.type(field, "github.com/mert{enter}");
    expect(within(portfolio).getByRole("alert")).toHaveTextContent(
      "https:// ile başlayan",
    );
    expect(addPeerMentorLink).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, "https://github.com/mert");
    await user.click(
      within(portfolio).getByRole("button", { name: "Bağlantı ekle" }),
    );

    expect(
      await within(portfolio).findByRole("link", {
        name: "https://github.com/mert",
      }),
    ).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(addPeerMentorLink).toHaveBeenCalledWith({
      url: "https://github.com/mert",
      visibility: PeerDocumentVisibility.Profile,
    });
    expect(field).toHaveValue("");
    expect(screen.getByText("1 / 1 zorunlu belge yüklendi")).toBeVisible();
  });

  it("shows why an upload failed", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadPeerMentorDocument).mockRejectedValueOnce(
      new Error("Yalnızca PDF dosyası yükleyebilirsin."),
    );
    renderStep();
    const certificate = await screen.findByRole("region", {
      name: "Lisans veya sertifika",
    });

    await user.upload(
      within(certificate).getByLabelText("dosya seç"),
      pdf("sertifika.pdf"),
    );

    expect(await within(certificate).findByRole("alert")).toHaveTextContent(
      "Yalnızca PDF dosyası yükleyebilirsin.",
    );
  });
});
