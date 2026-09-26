import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InterventionDrawer,
  NotifyInterventionDialog,
} from "@/components/admin/intervention-follow";
import type { AdminIntervention } from "@/interfaces/admin-intervention";
import {
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/client/admin-interventions";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-interventions", () => ({
  listAdminInterventions: vi.fn(),
  openAdminIntervention: vi.fn(),
  resolveAdminIntervention: vi.fn(),
}));

const follow = {
  id: "follow-1",
  mentorshipId: "mentorship-1",
  coordinatorId: "coordinator-1",
  coordinatorName: "Deniz Acar",
  openedByName: "Demo Administrator",
  action: "48 saat içinde görüşme planlansın",
  note: "Bu hafta bak",
  openedAt: "2026-09-26T10:00:00Z",
  readAt: null,
  plannedMeetingAt: null,
  resolvedAt: null,
} satisfies AdminIntervention;

describe("NotifyInterventionDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the suggestion and note, then reports that the follow-up opened", async () => {
    vi.mocked(openAdminIntervention).mockResolvedValue(follow);
    const onOpened = vi.fn();
    renderWithQueryClient(
      <NotifyInterventionDialog
        coordinatorName="Deniz Acar"
        pair="Ayşe Demir ↔ Lumen"
        programName="ODTÜ Stars 2026"
        signals={[{ label: "Son görüşme", value: "18 gün önce" }]}
        mentorshipId="mentorship-1"
        onClose={vi.fn()}
        onOpened={onOpened}
      />,
    );

    await userEvent.type(screen.getByLabelText("Not"), "Bu hafta bak");
    await userEvent.click(
      screen.getByRole("button", { name: "Bildir ve takibe al" }),
    );

    expect(openAdminIntervention).toHaveBeenCalledWith(
      {
        mentorshipId: "mentorship-1",
        action: "48 saat içinde görüşme planlansın",
        note: "Bu hafta bak",
      },
      expect.anything(),
    );
    expect(onOpened).toHaveBeenCalledOnce();
  });
});

describe("InterventionDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an unread notice and no planned meeting", () => {
    renderWithQueryClient(
      <InterventionDrawer
        intervention={follow}
        mentorName="Ayşe Demir"
        teamName="Lumen"
        programName="ODTÜ Stars 2026"
        signals={[{ label: "Son görüşme", value: "18 gün önce" }]}
        onClose={vi.fn()}
        onResolved={vi.fn()}
      />,
    );

    expect(screen.getByText("Henüz bildirimi açmadı")).toBeInTheDocument();
    expect(
      screen.getByText("Bildirimden sonra planlanmış görüşme yok"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bu hafta bak/)).toBeInTheDocument();
  });

  it("shows when the coordinator opened the notice and a later meeting", () => {
    renderWithQueryClient(
      <InterventionDrawer
        intervention={{
          ...follow,
          readAt: "2026-09-26T11:40:00Z",
          plannedMeetingAt: "2026-09-28T07:30:00Z",
          note: null,
        }}
        mentorName="Ayşe Demir"
        teamName="Lumen"
        programName="ODTÜ Stars 2026"
        signals={[{ label: "Son görüşme", value: "18 gün önce" }]}
        onClose={vi.fn()}
        onResolved={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/Deniz Acar/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Henüz bildirimi açmadı"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Bildirimden sonra planlanmış görüşme yok"),
    ).not.toBeInTheDocument();
  });

  it("marks the follow-up resolved", async () => {
    vi.mocked(resolveAdminIntervention).mockResolvedValue({
      ...follow,
      resolvedAt: "2026-09-26T12:00:00Z",
    });
    const onResolved = vi.fn();
    renderWithQueryClient(
      <InterventionDrawer
        intervention={follow}
        mentorName="Ayşe Demir"
        teamName="Lumen"
        programName="ODTÜ Stars 2026"
        signals={[]}
        onClose={vi.fn()}
        onResolved={onResolved}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Çözüldü olarak işaretle" }),
    );

    expect(resolveAdminIntervention).toHaveBeenCalledWith(
      "follow-1",
      expect.anything(),
    );
    expect(onResolved).toHaveBeenCalledOnce();
  });
});
