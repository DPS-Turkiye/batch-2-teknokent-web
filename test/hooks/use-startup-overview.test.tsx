import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  StartupFundingStage,
  type StartupProfile,
} from "@/interfaces/organization";
import { UserAccountStatus } from "@/interfaces/session";
import { DocumentKind } from "@/interfaces/startup-document";
import { StartupStage, StartupStageState } from "@/interfaces/startup-process";
import { getMeetings } from "@/lib/client/meetings";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getStartupProfile } from "@/lib/client/organization";
import { getOrganizationMembers } from "@/lib/client/organization-members";
import { getOrganizationPrograms } from "@/lib/client/programs";
import { getStartupDocuments } from "@/lib/client/startup-documents";
import { getStartupProcess } from "@/lib/client/startup-process";
import { organizationProgram } from "@test/fixtures/organization-programs";
import { documentFixture } from "@test/fixtures/startup-files";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/organization", () => ({
  getStartupProfile: vi.fn(),
}));
vi.mock("@/lib/client/organization-members", () => ({
  getOrganizationMembers: vi.fn(),
}));
vi.mock("@/lib/client/startup-documents", () => ({
  getStartupDocuments: vi.fn(),
  getDocumentDownloadUrl: vi.fn(),
}));
vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequests: vi.fn(),
}));
vi.mock("@/lib/client/meetings", () => ({
  getMeetings: vi.fn(),
}));
vi.mock("@/lib/client/programs", () => ({
  getOrganizationPrograms: vi.fn(),
}));
vi.mock("@/lib/client/startup-process", () => ({
  getStartupProcess: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

const profile: StartupProfile = {
  id: "org-1",
  name: "Döngü",
  description: "Gönüllülerle sosyal girişimleri buluşturur.",
  website: "dongu.app",
  problem: null,
  solution: null,
  currentSolution: null,
  targetUser: null,
  sector: "Sosyal etki",
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

describe("useStartupOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStartupProfile).mockResolvedValue(profile);
    vi.mocked(getOrganizationMembers).mockResolvedValue([
      {
        id: "u-1",
        email: "gulse@dongu.app",
        fullName: "Gülse Buran",
        role: "MENTEE",
        founder: true,
      },
      {
        id: "u-2",
        email: "sude@dongu.app",
        fullName: "Sude Arya",
        role: "MENTEE",
      },
    ]);
    vi.mocked(getStartupDocuments).mockResolvedValue([
      documentFixture("canvas-new", { kind: DocumentKind.Canvas }),
      documentFixture("deck"),
      documentFixture("canvas-old", { kind: DocumentKind.Canvas }),
    ]);
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [
        organizationProgram("p-0", "Eski program", { coordinatorName: "Ece" }),
        organizationProgram("p-1", "METU Stars 2026", {
          coordinatorName: "Ece",
        }),
      ],
      activeProgramId: "p-1",
    });
    vi.mocked(getStartupProcess).mockResolvedValue({
      organizationId: "org-1",
      currentStage: StartupStage.Mvp,
      stages: [{ stage: StartupStage.Mvp, state: StartupStageState.Current }],
      currentRound: null,
      rounds: [],
      assignments: [],
    });
    vi.mocked(getMentorRequests).mockResolvedValue([
      {
        id: "r-1",
        requesterId: "u-1",
        organizationId: "org-1",
        mentorId: "mentor-1",
        mentorName: "Nihan Öztürk",
        supportArea: "Ürün konumlandırma",
        status: MentorshipRequestStatus.Accepted,
        mentorMessage: null,
        rejectionReason: null,
        createdAt: "2026-08-01T09:00:00Z",
        messages: [],
        recommendationSnapshot: null,
        plannedSessionCount: 6,
      },
    ]);
    vi.mocked(getMeetings).mockResolvedValue([
      {
        id: "m-1",
        organizationId: "org-1",
        mentorshipRequestId: "r-1",
        scheduledAt: "2026-08-10T09:00:00Z",
        durationMinutes: 45,
        status: MeetingStatus.Completed,
      },
      {
        id: "m-2",
        organizationId: "org-1",
        mentorshipRequestId: "r-1",
        scheduledAt: "2099-01-10T09:00:00Z",
        durationMinutes: 45,
        status: MeetingStatus.Scheduled,
      },
    ]);
  });

  it("combines the profile with the latest canvas, the team size, the program and the stage", async () => {
    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.profile?.name).toBe("Döngü"));
    await waitFor(() => expect(result.current.teamSize).toBe(2));
    await waitFor(() =>
      expect(result.current.programName).toBe("METU Stars 2026"),
    );
    await waitFor(() => expect(result.current.stageName).toBe("MVP"));
    expect(result.current.canvas?.id).toBe("canvas-new");
  });

  it("summarizes each active mentorship's sessions", async () => {
    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.mentorships).toHaveLength(1));
    await waitFor(() =>
      expect(result.current.mentorships[0]?.heldSessions).toBe(1),
    );
    expect(result.current.mentorships[0]).toEqual({
      id: "r-1",
      mentorName: "Nihan Öztürk",
      supportArea: "Ürün konumlandırma",
      heldSessions: 1,
      plannedSessions: 6,
      nextMeetingAt: "2099-01-10T09:00:00Z",
    });
  });

  it("has no canvas when none was uploaded", async () => {
    vi.mocked(getStartupDocuments).mockResolvedValue([documentFixture("deck")]);

    const { result } = renderHook(() => useStartupOverview(), { wrapper });

    await waitFor(() => expect(result.current.documentsLoading).toBe(false));
    expect(result.current.canvas).toBeNull();
  });
});
