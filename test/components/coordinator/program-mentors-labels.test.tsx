import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMentorsView } from "@/components/coordinator/program-mentors-view";
import {
  MentorLabelColor,
  type MentorLabelBoard,
} from "@/interfaces/mentor-label";
import { MentorPoolStatus, type MentorPoolRow } from "@/interfaces/mentor-pool";
import {
  getCoordinatorProgram,
  getMentorPool,
  getProgramTeams,
} from "@/lib/client/coordinator-programs";
import {
  createMentorLabel,
  deleteMentorLabel,
  getMentorLabelBoard,
  setMentorLabels,
  updateMentorLabel,
} from "@/lib/client/mentor-labels";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/coordinator/programs/program-1",
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getMentorPool: vi.fn(),
  getProgramTeams: vi.fn(),
}));

vi.mock("@/lib/client/mentor-labels", () => ({
  getMentorLabelBoard: vi.fn(),
  createMentorLabel: vi.fn(),
  updateMentorLabel: vi.fn(),
  deleteMentorLabel: vi.fn(),
  setMentorLabels: vi.fn(),
}));

const nihan: MentorPoolRow = {
  mentorId: "mentor-1",
  inviteId: null,
  fullName: "Nihan Öztürk",
  email: "nihan@ozturk.design",
  status: MentorPoolStatus.Active,
  expertise: [],
  programs: [],
  activeTeams: 1,
  capacity: 4,
  since: "2026-09-20T10:00:00Z",
  expiresAt: null,
  inviteCode: null,
};
const kerem: MentorPoolRow = {
  ...nihan,
  mentorId: "mentor-3",
  fullName: "Kerem Aydın",
  email: "kerem@aydin.co",
  status: MentorPoolStatus.Full,
  activeTeams: 4,
};
const zeynep: MentorPoolRow = {
  ...nihan,
  mentorId: "mentor-2",
  fullName: "Zeynep Arslan",
  email: "zeynep@arslanlaw.com",
  status: MentorPoolStatus.AwaitingApproval,
};
const invite: MentorPoolRow = {
  ...nihan,
  mentorId: null,
  inviteId: "invite-1",
  fullName: null,
  email: "cagri@yilmazfinans.com",
  status: MentorPoolStatus.Invited,
  inviteCode: "abc123",
};

function board(overrides: Partial<MentorLabelBoard> = {}): MentorLabelBoard {
  return {
    enabled: true,
    editable: true,
    labels: [
      { id: "ai", name: "AI", color: MentorLabelColor.Teal, mentorCount: 1 },
      {
        id: "fintech",
        name: "Fintech",
        color: MentorLabelColor.Green,
        mentorCount: 2,
      },
    ],
    mentors: [
      { mentorId: "mentor-1", labelIds: ["ai", "fintech"] },
      { mentorId: "mentor-3", labelIds: ["fintech"] },
    ],
    ...overrides,
  };
}

function withLabels(enabled: boolean) {
  const detail = coordinatorProgramDetail();
  return coordinatorProgramDetail({
    rules: { ...detail.rules, mentorLabelsEnabled: enabled },
  });
}

async function openEditorFor(name: string) {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: `${name} için etiket ekle` }),
  );
  return user;
}

describe("Mentor Havuzu labels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(withLabels(true));
    vi.mocked(getMentorPool).mockResolvedValue([nihan, kerem, zeynep, invite]);
    vi.mocked(getProgramTeams).mockResolvedValue([]);
    vi.mocked(getMentorLabelBoard).mockResolvedValue(board());
  });

  it("shows no labels, no Etiket ekle and no filter while the switch is off", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(withLabels(false));
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await screen.findByText("Nihan Öztürk");
    expect(screen.queryByRole("button", { name: /etiket ekle/i })).toBeNull();
    expect(screen.queryByText("Etiket")).toBeNull();
    expect(screen.queryByRole("list", { name: "Etiketler" })).toBeNull();
    expect(getMentorLabelBoard).not.toHaveBeenCalled();
  });

  it("puts the labels and Etiket ekle on active and full mentors only", async () => {
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await screen.findByRole("button", {
      name: "Nihan Öztürk için etiket ekle",
    });
    const nihanRow = screen.getByText("Nihan Öztürk").closest("tr");
    expect(nihanRow).not.toBeNull();
    const nihanLabels = within(nihanRow ?? document.body).getByRole("list", {
      name: "Etiketler",
    });
    expect(within(nihanLabels).getAllByRole("listitem")).toHaveLength(2);
    expect(within(nihanLabels).getByText("AI")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kerem Aydın için etiket ekle" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Zeynep Arslan için etiket ekle" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: "cagri@yilmazfinans.com için etiket ekle",
      }),
    ).toBeNull();
  });

  it("filters to mentors who carry every selected label", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);
    await screen.findByRole("button", {
      name: "Nihan Öztürk için etiket ekle",
    });

    await user.click(screen.getByText("Etiket"));
    await user.click(screen.getByRole("checkbox", { name: "Fintech" }));
    expect(screen.getByText("Kerem Aydın")).toBeInTheDocument();
    expect(screen.queryByText("Zeynep Arslan")).toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "AI" }));
    expect(screen.getByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.queryByText("Kerem Aydın")).toBeNull();
    expect(screen.getByText("Etiket (2)")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Etiket filtresini temizle" }),
    );
    expect(screen.getByText("Zeynep Arslan")).toBeInTheDocument();
  });

  it("shows labels but no Etiket ekle when the program can no longer be edited", async () => {
    vi.mocked(getMentorLabelBoard).mockResolvedValue(
      board({ editable: false }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    expect(
      await screen.findAllByRole("list", { name: "Etiketler" }),
    ).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /etiket ekle/i })).toBeNull();
  });

  it("saves the picked labels for the mentor", async () => {
    vi.mocked(setMentorLabels).mockResolvedValue(
      board({ mentors: [{ mentorId: "mentor-1", labelIds: ["fintech"] }] }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    const user = await openEditorFor("Nihan Öztürk");
    const dialog = screen.getByRole("dialog", {
      name: "Etiketler · Nihan Öztürk",
    });
    expect(within(dialog).getByText(/2\/5 seçili/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "AI" }));
    const buttons = within(dialog).getAllByRole("button", { name: "Kaydet" });
    const save = buttons.at(-1);
    expect(save).toBeDefined();
    if (save) await user.click(save);

    expect(setMentorLabels).toHaveBeenCalledWith("program-1", "mentor-1", [
      "fintech",
    ]);
    expect(
      await screen.findByText("Etiketler kaydedildi."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stops at five labels", async () => {
    const labels = ["1", "2", "3", "4", "5", "6"].map((id) => ({
      id,
      name: `Etiket ${id}`,
      color: MentorLabelColor.Blue,
      mentorCount: 0,
    }));
    vi.mocked(getMentorLabelBoard).mockResolvedValue(
      board({
        labels,
        mentors: [
          { mentorId: "mentor-1", labelIds: ["1", "2", "3", "4", "5"] },
        ],
      }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await openEditorFor("Nihan Öztürk");
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("checkbox", { name: "Etiket 6" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("checkbox", { name: "Etiket 1" }),
    ).toBeEnabled();
    expect(
      within(dialog).getByText(/Bir mentora en fazla 5 etiket verilebilir/),
    ).toBeInTheDocument();
  });

  it("creates a label from a palette color and picks it for the mentor", async () => {
    vi.mocked(createMentorLabel).mockResolvedValue(
      board({
        labels: [
          ...board().labels,
          {
            id: "health",
            name: "Sağlık",
            color: MentorLabelColor.Red,
            mentorCount: 0,
          },
        ],
      }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    const user = await openEditorFor("Nihan Öztürk");
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Oluştur" }));
    expect(
      within(dialog).getByText("Etiket adı boş olamaz."),
    ).toBeInTheDocument();

    const name = within(dialog).getByLabelText("Etiket adı");
    await user.type(name, "fintech");
    expect(
      within(dialog).getByText("Bu isimde bir etiket zaten var."),
    ).toBeInTheDocument();
    await user.clear(name);
    await user.type(name, "  Sağlık ");
    await user.click(within(dialog).getByRole("button", { name: "Kırmızı" }));
    expect(
      within(dialog).getByRole("button", { name: "Kırmızı" }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(within(dialog).getByRole("button", { name: "Oluştur" }));

    expect(createMentorLabel).toHaveBeenCalledWith("program-1", {
      name: "Sağlık",
      color: MentorLabelColor.Red,
    });
    expect(
      await within(dialog).findByRole("checkbox", { name: "Sağlık" }),
    ).toBeChecked();
    expect(within(dialog).getByText(/3\/5 seçili/)).toBeInTheDocument();
  });

  it("renames and recolors a label in place, and can back out of editing", async () => {
    vi.mocked(updateMentorLabel).mockResolvedValue(
      board({
        labels: [
          {
            id: "ai",
            name: "Yapay zekâ",
            color: MentorLabelColor.Purple,
            mentorCount: 1,
          },
          {
            id: "fintech",
            name: "Fintech",
            color: MentorLabelColor.Green,
            mentorCount: 2,
          },
        ],
      }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    const user = await openEditorFor("Nihan Öztürk");
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "AI etiketini düzenle" }),
    );
    expect(within(dialog).getByText("Etiketi düzenle")).toBeInTheDocument();
    // The edit form's own Vazgeç comes before the dialog's.
    const [cancelEdit] = within(dialog).getAllByRole("button", {
      name: "Vazgeç",
    });
    expect(cancelEdit).toBeDefined();
    if (cancelEdit) await user.click(cancelEdit);
    expect(within(dialog).getByText("Yeni etiket")).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "AI etiketini düzenle" }),
    );
    const name = within(dialog).getByLabelText("Etiket adı");
    expect(name).toHaveValue("AI");
    await user.clear(name);
    await user.type(name, "Yapay zekâ");
    await user.click(within(dialog).getByRole("button", { name: "Mor" }));
    const [submit] = within(dialog).getAllByRole("button", { name: "Kaydet" });
    expect(submit).toBeDefined();
    if (submit) await user.click(submit);

    expect(updateMentorLabel).toHaveBeenCalledWith("program-1", "ai", {
      name: "Yapay zekâ",
      color: MentorLabelColor.Purple,
    });
    expect(await screen.findByText("Etiket güncellendi.")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("checkbox", { name: "Yapay zekâ" }),
    ).toBeChecked();
  });

  it("asks before deleting a label and names how many mentors lose it", async () => {
    vi.mocked(deleteMentorLabel).mockResolvedValue(
      board({
        labels: [
          {
            id: "ai",
            name: "AI",
            color: MentorLabelColor.Teal,
            mentorCount: 1,
          },
        ],
        mentors: [{ mentorId: "mentor-1", labelIds: ["ai"] }],
      }),
    );
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    const user = await openEditorFor("Nihan Öztürk");
    await user.click(
      screen.getByRole("button", { name: "Fintech etiketini sil" }),
    );
    const confirm = screen.getByRole("dialog", { name: "Etiket silinsin mi?" });
    expect(
      within(confirm).getByText(
        "“Fintech” etiketi silinecek ve 2 mentordan kaldırılacak.",
      ),
    ).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Sil" }));

    expect(deleteMentorLabel).toHaveBeenCalledWith("program-1", "fintech");
    const editor = await screen.findByRole("dialog", {
      name: "Etiketler · Nihan Öztürk",
    });
    expect(
      within(editor).queryByRole("checkbox", { name: "Fintech" }),
    ).toBeNull();
  });
});
