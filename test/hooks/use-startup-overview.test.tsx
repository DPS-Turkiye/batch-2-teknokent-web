import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import type { StartupProfile } from "@/interfaces/organization";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { getStartupProfile } from "@/lib/client/organization";
import { getOrganizationMembers } from "@/lib/client/organization-members";
import {
  getDocumentDownloadUrl,
  getStartupDocuments,
} from "@/lib/client/startup-documents";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/organization", () => ({
  getStartupProfile: vi.fn(),
  saveStartupProfile: vi.fn(),
  saveStartupStatus: vi.fn(),
}));

vi.mock("@/lib/client/organization-members", () => ({
  getOrganizationMembers: vi.fn(),
  addOrganizationMember: vi.fn(),
}));

vi.mock("@/lib/client/startup-documents", () => ({
  getStartupDocuments: vi.fn(),
  getDocumentDownloadUrl: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

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

function document(
  id: string,
  kind: DocumentKind,
  shared = false,
): StartupDocument {
  return {
    id,
    kind,
    originalFilename: `${id}.pdf`,
    contentType: "application/pdf",
    sizeBytes: 1024,
    createdAt: "2026-09-02T09:00:00Z",
    uploadedById: "user-1",
    uploadedByName: "Gülse Buran",
    meetingId: null,
    meetingAgenda: null,
    meetingScheduledAt: null,
    shares: shared
      ? [
          {
            mentorId: "mentor-1",
            mentorName: "Nihan Öztürk",
            sharedAt: "2026-09-05T10:00:00Z",
          },
        ]
      : [],
  };
}

describe("useStartupOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStartupProfile).mockResolvedValue(profile);
    vi.mocked(getOrganizationMembers).mockResolvedValue([
      {
        id: "u-2",
        email: "sude@dongu.app",
        fullName: "Sude Arya",
        role: "MENTEE",
      },
      {
        id: "u-1",
        email: "gulse@dongu.app",
        fullName: "Gülse Buran",
        role: "MENTEE",
        founder: true,
      },
      {
        id: "u-3",
        email: "doga@dongu.app",
        fullName: "Doğa Çağrı",
        role: "MENTEE",
      },
      {
        id: "u-4",
        email: "mert@dongu.app",
        fullName: "Mert Can",
        role: "MENTEE",
      },
    ]);
    vi.mocked(getStartupDocuments).mockResolvedValue([
      document("canvas-new", DocumentKind.Canvas, true),
      document("logo-1", DocumentKind.Logo),
      document("canvas-old", DocumentKind.Canvas),
      document("deck", DocumentKind.PitchDeck, true),
    ]);
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue({
      url: "https://bucket.s3/logo.png?sig",
      filename: "logo.png",
      contentType: "image/png",
    });
  });

  it("shows the latest canvas, the logo and only shared files", async () => {
    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.profile?.name).toBe("Döngü"));
    await waitFor(() =>
      expect(result.current.logoUrl).toBe("https://bucket.s3/logo.png?sig"),
    );
    expect(result.current.canvas?.id).toBe("canvas-new");
    expect(result.current.sharedDocuments.map((doc) => doc.id)).toEqual([
      "canvas-new",
      "deck",
    ]);
    expect(getDocumentDownloadUrl).toHaveBeenCalledWith("logo-1");
  });

  it("previews the team with the founder first", async () => {
    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.team).toHaveLength(3));
    expect(result.current.team[0].fullName).toBe("Gülse Buran");
  });

  it("has no logo link when the startup has not uploaded a logo", async () => {
    vi.mocked(getStartupDocuments).mockResolvedValue([
      document("deck", DocumentKind.PitchDeck),
    ]);

    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.documentsLoading).toBe(false));
    expect(result.current.logoUrl).toBeNull();
    expect(result.current.canvas).toBeNull();
    expect(getDocumentDownloadUrl).not.toHaveBeenCalled();
  });
});
