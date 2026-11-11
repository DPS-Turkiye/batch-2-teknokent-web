import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import type { AdminIntervention } from "@/interfaces/admin-intervention";
import type { AdminOverview } from "@/interfaces/admin-overview";
import { MentorshipTab } from "@/types/admin-mentorships";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

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

const overview: AdminOverview = {
  programs: [
    adminProgram({
      coordinatorId: "coord-1",
      coordinatorName: "Deniz Acar",
      startupCount: 2,
      startups: [adminStartup(), adminStartup({ id: "org-2", name: "Nova" })],
    }),
  ],
  users: [],
  mentorships: [
    adminMentorship({ daysSinceMeeting: 18 }),
    adminMentorship({
      id: "m-2",
      mentorId: "mentor-2",
      mentorName: "Kerem Tan",
      organizationId: "org-2",
      organizationName: "Nova",
      daysSinceMeeting: 20,
    }),
  ],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

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
    renderWithQueryClient(
      <MentorshipsView tab={MentorshipTab.Interventions} />,
    );

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

  it("reads in English, drawer included", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorshipsView tab={MentorshipTab.Interventions} />
      </InLocale>,
    );

    expect(screen.getByText("Following")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Notify the coordinator" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Needs intervention")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(
      screen.getByRole("dialog", { name: "Following Kerem Tan ↔ Nova" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hasn't opened the notification yet"),
    ).toBeInTheDocument();
  });

  it("drops a read follow-up from the unanswered filter and opens its drawer", async () => {
    harness.follow = [{ ...unread, readAt: "2026-09-26T11:00:00Z" }];
    renderWithQueryClient(
      <MentorshipsView tab={MentorshipTab.Interventions} />,
    );

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
