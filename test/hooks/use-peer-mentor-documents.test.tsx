import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  usePeerMentorDocumentsStep,
  usePeerMentorSharedDocuments,
} from "@/hooks/use-peer-mentor-documents";
import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { ToastTone } from "@/interfaces/toast";
import {
  deletePeerMentorDocument,
  getOwnPeerMentorDocuments,
  getPeerMentorDocuments,
  updatePeerMentorDocumentVisibility,
} from "@/lib/client/peer-mentor-documents";
import type { ToastInput } from "@/stores/toast-store";
import { EvidenceCard } from "@/types/peer-mentor-evidence";
import {
  peerFileFixture,
  peerLinkFixture,
} from "@test/fixtures/peer-mentor-documents";
import { createTestQueryClient } from "@test/test-utils";

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));
vi.mock("@/lib/client/peer-mentor-documents", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/client/peer-mentor-documents")
  >()),
  getOwnPeerMentorDocuments: vi.fn(),
  getPeerMentorDocuments: vi.fn(),
  updatePeerMentorDocumentVisibility: vi.fn(),
  deletePeerMentorDocument: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOwnPeerMentorDocuments).mockResolvedValue([
    peerFileFixture({ id: "cv-1", evidenceType: PeerEvidenceType.Cv }),
  ]);
});

describe("usePeerMentorDocumentsStep", () => {
  it("toasts when a visibility change or a removal fails", async () => {
    vi.mocked(updatePeerMentorDocumentVisibility).mockRejectedValue(
      new Error("boom"),
    );
    vi.mocked(deletePeerMentorDocument).mockRejectedValue("offline");
    const { result } = renderHook(
      () => usePeerMentorDocumentsStep({ topics: [], linkedinUrl: "" }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setVisibility(
        EvidenceCard.Cv,
        PeerDocumentVisibility.Profile,
      ),
    );
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "boom",
        tone: ToastTone.Error,
      }),
    );

    act(() => result.current.remove("cv-1"));
    await waitFor(() =>
      expect(showToast).toHaveBeenLastCalledWith({
        message: "Kaldırılamadı.",
        tone: ToastTone.Error,
      }),
    );
  });

  it("leaves a card's pieces alone when they already have the picked visibility", async () => {
    vi.mocked(updatePeerMentorDocumentVisibility).mockResolvedValue(
      peerFileFixture(),
    );
    const { result } = renderHook(
      () => usePeerMentorDocumentsStep({ topics: [], linkedinUrl: "" }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setVisibility(
        EvidenceCard.Cv,
        PeerDocumentVisibility.VerificationOnly,
      ),
    );

    await waitFor(() =>
      expect(
        result.current.cards.find((view) => view.card === EvidenceCard.Cv)
          ?.visibility,
      ).toBe(PeerDocumentVisibility.VerificationOnly),
    );
    expect(updatePeerMentorDocumentVisibility).not.toHaveBeenCalled();
  });
});

describe("usePeerMentorSharedDocuments", () => {
  it("gives the profile its files with where to open them, and the links", async () => {
    vi.mocked(getPeerMentorDocuments).mockResolvedValue([
      peerFileFixture(),
      peerLinkFixture(),
    ]);
    const { result } = renderHook(
      () => usePeerMentorSharedDocuments("mentor-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.files).toHaveLength(1));
    expect(result.current.files).toEqual([
      {
        id: peerFileFixture().id,
        name: "Transkript_2026_Guz.pdf",
        evidenceType: PeerEvidenceType.Transcript,
        href: `/api/peer-mentoring/documents/${peerFileFixture().id}/content`,
      },
    ]);
    expect(result.current.links).toEqual([
      {
        id: peerLinkFixture().id,
        url: "https://github.com/mertdemir",
        host: "github.com",
      },
    ]);
  });
});
