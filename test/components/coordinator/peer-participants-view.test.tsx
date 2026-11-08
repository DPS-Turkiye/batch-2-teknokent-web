import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerParticipantsView } from "@/components/coordinator/peer-participants-view";
import {
  BadgeSource,
  GateBadgeState,
  type GateBadgeRow,
} from "@/interfaces/badges";
import {
  getProgramBadgeRoster,
  postGateBadgeAward,
  postGateBadgeRevoke,
} from "@/lib/client/badges";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/coordinator/program-detail-frame", () => ({
  ProgramDetailFrame: ({
    children,
  }: {
    children: (detail: unknown) => React.ReactNode;
  }) => children({}),
}));
vi.mock("@/lib/client/badges", () => ({
  getProgramBadgeRoster: vi.fn(),
  postGateBadgeAward: vi.fn(),
  postGateBadgeRevoke: vi.fn(),
}));

function row(overrides: Partial<GateBadgeRow>): GateBadgeRow {
  return {
    userId: "u1",
    fullName: "Zeynep Öğrenci",
    email: "zeynep@odtu-dev.invalid",
    programId: "p1",
    programName: "İŞKUR 2026 Bahar",
    state: GateBadgeState.None,
    awardId: null,
    source: null,
    awardedAt: null,
    revokedAt: null,
    reason: null,
    ...overrides,
  };
}

describe("PeerParticipantsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramBadgeRoster).mockResolvedValue([
      row({}),
      row({
        userId: "u2",
        fullName: "Mehmet Mentor",
        state: GateBadgeState.Active,
        awardId: "a2",
        source: BadgeSource.Coordinator,
        awardedAt: "2026-11-08T10:00:00Z",
      }),
    ]);
  });

  it("awards the badge to a student who has none", async () => {
    vi.mocked(postGateBadgeAward).mockResolvedValue(
      row({ state: GateBadgeState.Active }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <PeerParticipantsView programId="p1" tab={ProgramTab.Students} />,
    );

    const zeynep = (await screen.findByText("Zeynep Öğrenci")).closest("tr")!;
    expect(within(zeynep).getByText("Rozet Yok")).toBeInTheDocument();
    await user.click(within(zeynep).getByRole("button", { name: "Rozet ver" }));

    await waitFor(() =>
      expect(postGateBadgeAward).toHaveBeenCalledWith("p1", "u1"),
    );
    expect(getProgramBadgeRoster).toHaveBeenCalledWith("p1", null);
  });

  // A revoke always says why; the button stays off until a reason is typed.
  it("takes a badge back only with a reason", async () => {
    vi.mocked(postGateBadgeRevoke).mockResolvedValue(
      row({ state: GateBadgeState.Revoked }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <PeerParticipantsView programId="p1" tab={ProgramTab.Students} />,
    );

    const mehmet = (await screen.findByText("Mehmet Mentor")).closest("tr")!;
    expect(within(mehmet).getByText("Rozet Kazanıldı")).toBeInTheDocument();
    await user.click(
      within(mehmet).getByRole("button", { name: "Rozeti geri al" }),
    );

    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Geri al" });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dialog).getByLabelText("Neden"),
      "  Görüşmelere gelmedi ",
    );
    await user.click(confirm);

    await waitFor(() =>
      expect(postGateBadgeRevoke).toHaveBeenCalledWith(
        "p1",
        "a2",
        "Görüşmelere gelmedi",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("asks only for badge holders on Akran Mentorları", async () => {
    renderWithQueryClient(
      <PeerParticipantsView programId="p1" tab={ProgramTab.PeerMentors} />,
    );
    await screen.findByText("Mehmet Mentor");
    expect(getProgramBadgeRoster).toHaveBeenCalledWith(
      "p1",
      GateBadgeState.Active,
    );
  });

  it("shows the backend's refusal", async () => {
    vi.mocked(postGateBadgeAward).mockRejectedValue(
      new Error(
        "Rozet yalnızca bu programın onaylı öğrencilerine verilebilir.",
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <PeerParticipantsView programId="p1" tab={ProgramTab.Students} />,
    );

    const zeynep = (await screen.findByText("Zeynep Öğrenci")).closest("tr")!;
    await user.click(within(zeynep).getByRole("button", { name: "Rozet ver" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Rozet yalnızca bu programın onaylı öğrencilerine verilebilir.",
    );
  });
});
