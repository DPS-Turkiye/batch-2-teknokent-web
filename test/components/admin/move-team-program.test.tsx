import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MoveTeamProgram } from "@/components/admin/move-team-program";
import { moveStartupToProgram } from "@/lib/client/admin-program-members";
import { ClientApiError } from "@/lib/client/api";
import { adminProgram, adminStartup } from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  moveStartupToProgram: vi.fn(),
}));

const team = adminStartup({
  id: "org-1",
  name: "Lumen",
  programId: "program-1",
  programName: "Ön Kuluçka 2026",
});
const incubation = adminProgram({ id: "program-2", name: "Kuluçka 2026" });
const growth = adminProgram({ id: "program-3", name: "Büyüme 2026" });

function show(programs = [incubation, growth]) {
  const onMoved = vi.fn<() => void>();
  renderWithQueryClient(
    <MoveTeamProgram team={team} programs={programs} onMoved={onMoved} />,
  );
  return { user: userEvent.setup(), onMoved };
}

async function askToMove(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Taşınacak program" }),
    "program-2",
  );
  await user.click(screen.getByRole("button", { name: "Programı değiştir" }));
  return screen.getByRole("dialog", {
    name: "Takımın programı değiştirilsin mi?",
  });
}

describe("MoveTeamProgram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moveStartupToProgram).mockResolvedValue({
      id: "move-1",
      organizationId: "org-1",
      fromProgramId: "program-1",
      fromProgramName: "Ön Kuluçka 2026",
      toProgramId: "program-2",
      toProgramName: "Kuluçka 2026",
      movedAt: "2026-11-13T12:00:00Z",
      withdrawnRequests: 0,
    });
  });

  it("offers the other open programs and waits for one to be chosen", () => {
    show();

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Yeni programı seç", "Kuluçka 2026", "Büyüme 2026"]);
    expect(
      screen.getByRole("button", { name: "Programı değiştir" }),
    ).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says so when there is no other open program", () => {
    show([]);

    expect(
      screen.getByText("Takımın taşınabileceği başka açık program yok."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lists what moves, what stays and what is closed before anything is sent", async () => {
    const { user } = show();

    const dialog = await askToMove(user);

    expect(
      within(dialog).getByText(
        "Lumen takımı Ön Kuluçka 2026 programından Kuluçka 2026 programına taşınacak.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Yeni programa taşınacaklar"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /takımın hiçbir bilgiyi yeniden girmesi gerekmez/,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Eski programda kalacaklar"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /süren mentorluklar ve planlı görüşmeler eski programın adıyla devam eder/,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Kapatılacaklar")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/yanıt bekleyen mentorluk talepleri/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/takımın henüz yüklemediği belgeler/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "İki programın koordinatörlerine ve takımın üyelerine bildirim gider.",
      ),
    ).toBeInTheDocument();
    expect(moveStartupToProgram).not.toHaveBeenCalled();
  });

  it("opens with the focus on Vazgeç, not on the button that moves", async () => {
    const { user } = show();

    const dialog = await askToMove(user);

    expect(
      within(dialog).getByRole("button", { name: "Vazgeç" }),
    ).toHaveFocus();
  });

  it("stays open when the admin clicks inside it", async () => {
    const { user } = show();

    const dialog = await askToMove(user);
    await user.click(within(dialog).getByText("Kapatılacaklar"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves the team once the admin confirms", async () => {
    const { user, onMoved } = show();

    const dialog = await askToMove(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Takımı taşı" }),
    );

    expect(
      await screen.findByText("Lumen takımı Kuluçka 2026 programına taşındı."),
    ).toBeInTheDocument();
    expect(moveStartupToProgram).toHaveBeenCalledWith(
      "program-2",
      "org-1",
      "program-1",
    );
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    [
      "Vazgeç",
      async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
        user.click(within(dialog).getByRole("button", { name: "Vazgeç" })),
    ],
    [
      "Escape",
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.keyboard("{Escape}"),
    ],
    [
      "a click outside it",
      async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
        user.click(dialog),
    ],
  ])("closes without moving on %s", async (_how, leave) => {
    const { user, onMoved } = show();

    const dialog = await askToMove(user);
    await leave(user, dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(moveStartupToProgram).not.toHaveBeenCalled();
    expect(onMoved).not.toHaveBeenCalled();
  });

  it("shows why the backend refused the move", async () => {
    vi.mocked(moveStartupToProgram).mockRejectedValue(
      new ClientApiError(
        "ali@gmail.com adresi bu programa katılamaz.",
        400,
        "INVALID_REQUEST",
      ),
    );
    const { user, onMoved } = show();

    const dialog = await askToMove(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Takımı taşı" }),
    );

    expect(
      await screen.findByText("ali@gmail.com adresi bu programa katılamaz."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onMoved).not.toHaveBeenCalled();
  });
});
