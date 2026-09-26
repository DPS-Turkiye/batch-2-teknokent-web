import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import type { AdminIntervention } from "@/interfaces/admin-intervention";
import type { AdminOverview } from "@/interfaces/admin-overview";
import { renderWithQueryClient } from "@test/test-utils";

const harness = vi.hoisted(() => ({
  follow: [] as AdminIntervention[],
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

vi.mock("@/hooks/use-admin-interventions", () => ({
  useAdminInterventions: () => ({
    data: harness.follow,
    isLoading: false,
    error: null,
  }),
  useOpenIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResolveIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const overview = {
  programs: [
    {
      id: "program-1",
      name: "ODTÜ Stars 2026",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      coordinatorId: "coord-1",
      coordinatorName: "Deniz Acar",
      startupCount: 2,
      acceptedMentorCount: 0,
      pendingMentorCount: 0,
      startups: [
        {
          id: "org-1",
          name: "Lumen",
          sector: null,
          programId: "program-1",
          programName: "ODTÜ Stars 2026",
        },
        {
          id: "org-2",
          name: "Nova",
          sector: null,
          programId: "program-1",
          programName: "ODTÜ Stars 2026",
        },
      ],
      mentors: [],
    },
  ],
  users: [],
  mentorships: [
    {
      id: "m-1",
      mentorId: "mentor-1",
      mentorName: "Ayşe Demir",
      organizationId: "org-1",
      organizationName: "Lumen",
      status: "ACTIVE",
      startDate: "2026-01-01",
      endDate: null,
      progressPercent: 0,
      daysSinceMeeting: 18,
    },
    {
      id: "m-2",
      mentorId: "mentor-2",
      mentorName: "Kerem Tan",
      organizationId: "org-2",
      organizationName: "Nova",
      status: "ACTIVE",
      startDate: "2026-01-01",
      endDate: null,
      progressPercent: 0,
      daysSinceMeeting: 20,
    },
  ],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
} satisfies AdminOverview;

const unread = {
  id: "follow-1",
  mentorshipId: "m-2",
  coordinatorId: "coord-1",
  coordinatorName: "Deniz Acar",
  openedByName: "Demo Administrator",
  action: "48 saat içinde görüşme planlansın",
  note: null,
  openedAt: "2026-09-26T10:00:00Z",
  readAt: null,
  plannedMeetingAt: null,
  resolvedAt: null,
} satisfies AdminIntervention;

describe("Mentorship interventions", () => {
  beforeEach(() => {
    harness.follow = [unread];
  });

  it("keeps an open unread follow-up out of Kritik and in the tracking filters", async () => {
    renderWithQueryClient(<MentorshipsView tab="interventions" />);

    expect(screen.getByText("Ayşe Demir ↔ Lumen")).toBeInTheDocument();
    expect(screen.getByText("Kerem Tan ↔ Nova")).toBeInTheDocument();
    expect(screen.getByText("Takipte")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Koordinatöre bildir" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Kritik/ }));
    expect(screen.getByText("Ayşe Demir ↔ Lumen")).toBeInTheDocument();
    expect(screen.queryByText("Kerem Tan ↔ Nova")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Atanmış/ }));
    expect(screen.getByText("Kerem Tan ↔ Nova")).toBeInTheDocument();
    expect(screen.queryByText("Ayşe Demir ↔ Lumen")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /^Koordinatör yanıtı yok/ }),
    );
    expect(screen.getByText("Kerem Tan ↔ Nova")).toBeInTheDocument();
    expect(screen.queryByText("Ayşe Demir ↔ Lumen")).not.toBeInTheDocument();
  });

  it("drops a read follow-up from the unanswered filter and opens its drawer", async () => {
    harness.follow = [{ ...unread, readAt: "2026-09-26T11:00:00Z" }];
    renderWithQueryClient(<MentorshipsView tab="interventions" />);

    await userEvent.click(
      screen.getByRole("button", { name: /^Koordinatör yanıtı yok/ }),
    );
    expect(screen.getByText("Açılmamış bildirim yok.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Tümü/ }));
    await userEvent.click(screen.getByRole("button", { name: "Detay" }));
    expect(
      screen.getByRole("dialog", { name: "Kerem Tan ↔ Nova takibi" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Henüz bildirimi açmadı"),
    ).not.toBeInTheDocument();
  });
});
