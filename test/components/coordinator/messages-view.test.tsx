import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorMessagesView } from "@/components/coordinator/messages-view";
import { CoordinatorConversationCounterpart } from "@/interfaces/coordinator-conversation";
import { ProgramMentorStatus } from "@/interfaces/program";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
  startCoordinatorConversation,
} from "@/lib/client/coordinator-conversations";
import { getCoordinatorMentorships } from "@/lib/client/coordinator-mentorships";
import { getCoordinatorPrograms } from "@/lib/client/coordinator-programs";
import { getProgramDetail } from "@/lib/client/programs";
import {
  coordinatorConversation,
  coordinatorMessage,
} from "@test/fixtures/coordinator-conversations";
import { coordinatorMentorship } from "@test/fixtures/coordinator-mentorships";
import { coordinatorProgram } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-conversations", () => ({
  getCoordinatorConversations: vi.fn(),
  getCoordinatorMessages: vi.fn(),
  sendCoordinatorMessage: vi.fn(),
  startCoordinatorConversation: vi.fn(),
}));
vi.mock("@/lib/client/coordinator-mentorships", () => ({
  getCoordinatorMentorships: vi.fn(),
}));
vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorPrograms: vi.fn(),
}));
vi.mock("@/lib/client/programs", () => ({
  getProgramDetail: vi.fn(),
}));

const noLink = { conversationId: null, start: null };
const ayse = coordinatorConversation();
const lumen = coordinatorConversation({
  id: "conversation-2",
  counterpartType: CoordinatorConversationCounterpart.Team,
  counterpartId: "org-1",
  counterpartName: "Lumen",
  lastMessagePreview: "Nakit akışı tablosu hazır",
});

describe("CoordinatorMessagesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorPrograms).mockResolvedValue([coordinatorProgram()]);
    vi.mocked(getCoordinatorMentorships).mockResolvedValue([
      coordinatorMentorship(),
    ]);
    vi.mocked(getCoordinatorConversations).mockResolvedValue([ayse, lumen]);
    vi.mocked(getCoordinatorMessages).mockResolvedValue([coordinatorMessage()]);
  });

  it("lists the threads with the unread and risk summary", async () => {
    renderWithQueryClient(<CoordinatorMessagesView link={noLink} />);

    const list = await screen.findByRole("list", { name: "Konuşmalar" });
    expect(await within(list).findByText("Ayşe Demir")).toBeInTheDocument();
    expect(within(list).getByText("Mentor · Lumen")).toBeInTheDocument();
    expect(within(list).getByText("Takım · Ayşe Demir")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "2 okunmamış mesaj · 2 konuşma riskli bir mentorlukla ilgili",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bir konuşma seçin ya da yeni bir mesaj başlatın."),
    ).toBeInTheDocument();
  });

  it("opens a thread with its related mentorship and sends a reply", async () => {
    vi.mocked(sendCoordinatorMessage).mockResolvedValue(
      coordinatorMessage({ id: "message-2", mine: true, body: "Harika" }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorMessagesView link={noLink} />);

    const list = await screen.findByRole("list", { name: "Konuşmalar" });
    await user.click(await within(list).findByText("Ayşe Demir"));

    expect(
      await screen.findByText("Bu hafta Perşembe 10:30 uygun."),
    ).toBeInTheDocument();
    expect(getCoordinatorMessages).toHaveBeenCalledWith("conversation-1");
    const related = screen.getByRole("complementary", {
      name: "İlgili mentorluklar",
    });
    expect(within(related).getByText("↔ Lumen")).toBeInTheDocument();
    expect(
      within(related).getByRole("link", { name: /Mentorluğu aç/ }),
    ).toHaveAttribute(
      "href",
      "/coordinator/mentorships?mentorship=mentorship-1",
    );

    const send = screen.getByRole("button", { name: "Gönder" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Mesaj"), "  Harika  ");
    await user.click(send);

    expect(sendCoordinatorMessage).toHaveBeenCalledWith(
      "conversation-1",
      "Harika",
    );
    expect(screen.getByLabelText("Mesaj")).toHaveValue("");
  });

  it("narrows to team threads", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorMessagesView link={noLink} />);

    await user.click(await screen.findByRole("button", { name: "Takımlar 1" }));

    const list = screen.getByRole("list", { name: "Konuşmalar" });
    expect(within(list).queryByText("Ayşe Demir")).not.toBeInTheDocument();
    expect(within(list).getByText("Lumen")).toBeInTheDocument();
  });

  it("opens the thread a deep link names, creating it if needed", async () => {
    vi.mocked(startCoordinatorConversation).mockResolvedValue(ayse);
    renderWithQueryClient(
      <CoordinatorMessagesView
        link={{
          conversationId: null,
          start: {
            programId: "program-1",
            mentorId: "mentor-1",
            organizationId: null,
          },
        }}
      />,
    );

    expect(
      await screen.findByText("Bu hafta Perşembe 10:30 uygun."),
    ).toBeInTheDocument();
    expect(startCoordinatorConversation).toHaveBeenCalledTimes(1);
    expect(startCoordinatorConversation).toHaveBeenCalledWith({
      programId: "program-1",
      mentorId: "mentor-1",
      organizationId: null,
    });
  });

  it("starts a thread with a team of the program", async () => {
    vi.mocked(getProgramDetail).mockResolvedValue({
      id: "program-1",
      name: "METU Stars 2026",
      coordinatorId: "coordinator-1",
      coordinatorName: "Elif Demir",
      createdAt: "2026-02-01T09:00:00Z",
      startups: [
        { id: "org-9", name: "Terra", description: null, members: [] },
      ],
      mentors: [
        {
          mentorId: "mentor-9",
          fullName: "Bekleyen Mentor",
          email: "m@tekno.test",
          status: ProgramMentorStatus.Pending,
          invitedBy: "COORDINATOR",
          createdAt: "2026-02-01T09:00:00Z",
        },
      ],
    } as never);
    vi.mocked(startCoordinatorConversation).mockResolvedValue(
      coordinatorConversation({
        id: "conversation-9",
        counterpartType: CoordinatorConversationCounterpart.Team,
        counterpartId: "org-9",
        counterpartName: "Terra",
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorMessagesView link={noLink} />);

    await user.click(
      await screen.findByRole("button", { name: "+ Yeni mesaj" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Yeni mesaj" });
    const to = within(dialog).getByLabelText("Kime");
    await within(dialog).findByRole("option", { name: "Terra · Takım" });
    expect(
      within(dialog).queryByRole("option", { name: /Bekleyen Mentor/ }),
    ).not.toBeInTheDocument();
    await user.selectOptions(to, "TEAM:org-9");
    await user.click(
      within(dialog).getByRole("button", { name: "Konuşmayı aç" }),
    );

    expect(startCoordinatorConversation).toHaveBeenCalledWith({
      programId: "program-1",
      organizationId: "org-9",
      mentorId: null,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
