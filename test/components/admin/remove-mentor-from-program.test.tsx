import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoveMentorFromProgram } from "@/components/admin/remove-mentor-from-program";
import { removeMentorFromProgram } from "@/lib/client/admin-program-members";
import { ClientApiError } from "@/lib/client/api";
import { adminProgram } from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  removeMentorFromProgram: vi.fn(),
}));

const mentor = { id: "mentor-1", fullName: "Leyla Aksoy" };
const program = adminProgram({ id: "program-1", name: "Kuluçka 2026" });

function show() {
  renderWithQueryClient(
    <RemoveMentorFromProgram mentor={mentor} program={program} />,
  );
  return userEvent.setup();
}

async function askToRemove(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "Programdan çıkar: Kuluçka 2026" }),
  );
  return screen.getByRole("dialog", {
    name: "Mentor programdan çıkarılsın mı?",
  });
}

describe("RemoveMentorFromProgram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(removeMentorFromProgram).mockResolvedValue({
      id: "removal-1",
      mentorId: "mentor-1",
      programId: "program-1",
      programName: "Kuluçka 2026",
      removedAt: "2026-11-13T12:00:00Z",
      withdrawnRequests: 0,
    });
  });

  it("shows the action with the program in its name and no dialog until asked", () => {
    show();

    expect(
      screen.getByRole("button", { name: "Programdan çıkar: Kuluçka 2026" }),
    ).toHaveTextContent("Programdan çıkar");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists what stops, what keeps running and what is withdrawn before anything is sent", async () => {
    const user = show();

    const dialog = await askToRemove(user);

    expect(
      within(dialog).getByText(
        "Leyla Aksoy, Kuluçka 2026 programının mentorları arasından çıkarılacak. Diğer programları etkilenmez.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Sona erecekler")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/programın takımlarına önerilmez/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/haftalık planını ve duyurularını artık görmez/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Devam edecekler")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /süren mentorluklar ve planlı görüşmeler; program adıyla devam eder/,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Geri çekilecekler")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/yanıt bekleyen mentorluk talepleri/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Mentora ve programın koordinatörlerine bildirim gider/,
      ),
    ).toBeInTheDocument();
    expect(removeMentorFromProgram).not.toHaveBeenCalled();
  });

  it("opens with the focus on Vazgeç, not on the button that removes", async () => {
    const user = show();

    const dialog = await askToRemove(user);

    expect(
      within(dialog).getByRole("button", { name: "Vazgeç" }),
    ).toHaveFocus();
  });

  it("stays open when the admin clicks inside it", async () => {
    const user = show();

    const dialog = await askToRemove(user);
    await user.click(within(dialog).getByText("Geri çekilecekler"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("removes the mentor once the admin confirms", async () => {
    const user = show();

    const dialog = await askToRemove(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Mentoru çıkar" }),
    );

    expect(
      await screen.findByText(
        "Leyla Aksoy, Kuluçka 2026 programından çıkarıldı.",
      ),
    ).toBeInTheDocument();
    expect(removeMentorFromProgram).toHaveBeenCalledWith(
      "program-1",
      "mentor-1",
    );
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
  ])("closes without removing on %s", async (_how, leave) => {
    const user = show();

    const dialog = await askToRemove(user);
    await leave(user, dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(removeMentorFromProgram).not.toHaveBeenCalled();
  });

  it("shows why the backend refused the removal", async () => {
    vi.mocked(removeMentorFromProgram).mockRejectedValue(
      new ClientApiError(
        "Mentor bu programda kayıtlı değil.",
        400,
        "INVALID_REQUEST",
      ),
    );
    const user = show();

    const dialog = await askToRemove(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Mentoru çıkar" }),
    );

    expect(
      await screen.findByText("Mentor bu programda kayıtlı değil."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
