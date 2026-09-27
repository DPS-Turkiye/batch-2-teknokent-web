import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MenteeMessagesView } from "@/components/mentee-messages-view";
import { useMenteeMessages } from "@/hooks/use-mentee-messages";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  coordinatorConversation,
  coordinatorMessage,
  programThreadsStub,
} from "@test/fixtures/coordinator-conversations";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/hooks/use-mentee-messages", () => ({
  useMenteeMessages: vi.fn(),
}));

const select = vi.fn();

function mockMessages(overrides: Record<string, unknown> = {}) {
  const request = menteeRequestFixture({
    id: "r1",
    mentorName: "Barış Öztürk",
    status: MentorshipRequestStatus.Accepted,
    messages: [],
  });
  vi.mocked(useMenteeMessages).mockReturnValue({
    active: request,
    activeId: "r1",
    conversations: [request],
    error: null,
    fileUpload: { isPending: false, mutateAsync: vi.fn() },
    isLoading: false,
    messageForm: {
      reply: "",
      setReply: vi.fn(),
      sendReply: vi.fn(),
      isSending: false,
    },
    programThreads: programThreadsStub(),
    select,
    viewerUserId: "mentee-1",
    ...overrides,
  } as unknown as ReturnType<typeof useMenteeMessages>);
}

describe("MenteeMessagesView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the mentorship thread when no program thread is open", () => {
    mockMessages();
    render(<MenteeMessagesView />);

    expect(
      screen.getByRole("heading", { name: "Barış Öztürk" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Program")).not.toBeInTheDocument();
  });

  it("lists coordinator threads and opens one in place of the mentorship", async () => {
    const user = userEvent.setup();
    const thread = coordinatorConversation();
    const open = vi.fn();
    mockMessages({
      programThreads: programThreadsStub({
        threads: [thread],
        openId: thread.id,
        active: thread,
        open,
        messages: [coordinatorMessage({ body: "Demo Day tarihi belli oldu" })],
      }),
    });
    render(<MenteeMessagesView />);

    expect(
      screen.getByRole("heading", { name: "METU Stars 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Demo Day tarihi belli oldu")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Barış Öztürk" }),
    ).not.toBeInTheDocument();

    const list = screen.getByRole("complementary");
    await user.click(
      within(list).getByRole("button", { name: /METU Stars 2026/ }),
    );
    expect(open).toHaveBeenCalledWith(thread.id);

    await user.click(
      within(list).getByRole("button", { name: /Barış Öztürk/ }),
    );
    expect(select).toHaveBeenCalledWith("r1");
  });
});
