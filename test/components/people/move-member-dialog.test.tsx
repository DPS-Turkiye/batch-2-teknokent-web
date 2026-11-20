import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MoveMemberButton } from "@/components/people/move-member-dialog";
import { TeamMoveBlock } from "@/interfaces/team-move";
import { getTeamMoveOptions, moveMemberToTeam } from "@/lib/client/team-moves";
import {
  founderBlocked,
  soloFounder,
  teamMoveOptions,
  teamMoveResult,
} from "@test/fixtures/team-moves";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/team-moves", () => ({
  getTeamMoveOptions: vi.fn(),
  moveMemberToTeam: vi.fn(),
}));

function show() {
  renderWithQueryClient(
    <MoveMemberButton userId="user-1" programId="program-1" className="" />,
  );
  return userEvent.setup();
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Başka takıma taşı" }));
  return screen.findByRole("dialog", { name: "Başka takıma taşı" });
}

describe("MoveMemberButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTeamMoveOptions).mockResolvedValue(teamMoveOptions());
    vi.mocked(moveMemberToTeam).mockResolvedValue(teamMoveResult());
  });

  it("shows the current team and lists the teams this caller may pick", async () => {
    const user = show();
    const dialog = await open(user);

    expect(await within(dialog).findByText("Mert Kaya")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Şu anki takım: Döngü · Kuluçka 2026"),
    ).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual(["org-tree", "org-new"]);
    expect(within(dialog).getByRole("button", { name: "Taşı" })).toBeDisabled();
  });

  it("searches the teams and says when nothing matches", async () => {
    const user = show();
    const dialog = await open(user);
    const search = await within(dialog).findByRole("searchbox", {
      name: "Takım ara",
    });

    await user.type(search, "hızlandırma");
    expect(within(dialog).getAllByRole("radio")).toHaveLength(1);

    await user.clear(search);
    await user.type(search, "rüzgar");
    expect(
      within(dialog).getByText("Aramaya uyan takım yok."),
    ).toBeInTheDocument();
  });

  it("lists what moves and what stays, then moves to the chosen team", async () => {
    const user = show();
    const dialog = await open(user);

    await user.click(
      await within(dialog).findByRole("radio", { name: /Pazar Lab/ }),
    );

    expect(
      within(dialog).getByText("Mert Kaya, Pazar Lab takımına taşınacak."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("CV'si ve fotoğrafı")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Mentorluklar, mentorluk talepleri ve görüşmeler",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/en geç 10 dakika içinde oturumdan çıkarılır/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Taşı" }));

    expect(moveMemberToTeam).toHaveBeenCalledWith("user-1", "org-new");
    expect(
      await screen.findByText("Mert Kaya, Pazar Lab takımına taşındı."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains why a founder cannot be moved and offers no team", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(founderBlocked());
    const user = show();
    const dialog = await open(user);

    expect(
      await within(dialog).findByText(
        /Önce "Kurucuyu değiştir" ile başka bir üyeyi kurucu yapın/,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Taşı" }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Kapat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains a staff account", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(
      teamMoveOptions({
        blockedBy: TeamMoveBlock.NotATeamMember,
        currentTeam: null,
        targets: [],
      }),
    );
    const user = show();
    const dialog = await open(user);

    expect(
      await within(dialog).findByText(
        /Yalnızca girişim ekip üyeleri taşınabilir/,
      ),
    ).toBeInTheDocument();
  });

  it("says so when there is no other team to pick", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(
      teamMoveOptions({ targets: [] }),
    );
    const user = show();
    const dialog = await open(user);

    expect(
      await within(dialog).findByText(
        "Bu kişiyi taşıyabileceğiniz başka bir takım yok.",
      ),
    ).toBeInTheDocument();
  });

  it("shows why the options could not be loaded", async () => {
    vi.mocked(getTeamMoveOptions).mockRejectedValue(
      new Error("Kullanıcı bulunamadı."),
    );
    const user = show();
    const dialog = await open(user);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Kullanıcı bulunamadı.",
    );
  });

  it("closes on Vazgeç without moving anyone", async () => {
    const user = show();
    const dialog = await open(user);
    await within(dialog).findAllByRole("radio");

    await user.click(within(dialog).getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("warns that a solo founder's startup is archived before moving them", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(soloFounder());
    vi.mocked(moveMemberToTeam).mockResolvedValue(
      teamMoveResult({ archivedFrom: true, withdrawnRequests: 2 }),
    );
    const user = show();
    const dialog = await open(user);

    await user.click(
      await within(dialog).findByRole("radio", { name: /Pazar Lab/ }),
    );

    expect(
      within(dialog).getByText(
        /Eski girişim \(Döngü\) boşalacağı için arşivlenir\./,
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Taşı" }));
    expect(
      await screen.findByText(
        "Merve Geçer, Pazar Lab takımına taşındı; Döngü arşivlendi. 2 yanıt bekleyen talep kapatıldı.",
      ),
    ).toBeInTheDocument();
  });

  it("does not warn about archiving for a member who is not the founder", async () => {
    const user = show();
    const dialog = await open(user);

    await user.click(
      await within(dialog).findByRole("radio", { name: /Pazar Lab/ }),
    );

    expect(within(dialog).queryByText(/arşivlenir/)).not.toBeInTheDocument();
  });
});
