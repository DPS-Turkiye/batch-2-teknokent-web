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
import {
  myAnnouncementsStub,
  programAnnouncement,
} from "@test/fixtures/program-announcements";
import { idleMutation } from "@test/mocks/query-results";
import { InLocale } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));
vi.mock("@/hooks/use-mentee-messages", () => ({
  useMenteeMessages: vi.fn(),
}));

const select = vi.fn<(id: string) => void>();
const openProgramThread = vi.fn<(id: string) => void>();

type Messages = ReturnType<typeof useMenteeMessages>;

function mockMessages(overrides: Partial<Messages> = {}) {
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
    fileUpload: idleMutation(),
    isLoading: false,
    messageForm: {
      reply: "",
      setReply: vi.fn<Messages["messageForm"]["setReply"]>(),
      sendReply: vi.fn<Messages["messageForm"]["sendReply"]>(),
      isSending: false,
      error: null,
    },
    programThreads: programThreadsStub(),
    announcements: myAnnouncementsStub(),
    openProgramThread,
    openAnnouncements: vi.fn<Messages["openAnnouncements"]>(),
    select,
    viewerUserId: "mentee-1",
    ...overrides,
  });
}

describe("MenteeMessagesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = new URLSearchParams();
  });

  it("reads in English", () => {
    mockMessages();
    render(
      <InLocale locale="en">
        <MenteeMessagesView />
      </InLocale>,
    );

    expect(screen.getByText("Active mentorship")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search mentors or topics…"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

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
    mockMessages({
      programThreads: programThreadsStub({
        threads: [thread],
        openId: thread.id,
        active: thread,
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
    expect(openProgramThread).toHaveBeenCalledWith(thread.id);

    await user.click(
      within(list).getByRole("button", { name: /Barış Öztürk/ }),
    );
    expect(select).toHaveBeenCalledWith("r1");
  });

  it("shows the program's announcements read-only", async () => {
    const user = userEvent.setup();
    const openAnnouncements = vi.fn<Messages["openAnnouncements"]>();
    const announcement = programAnnouncement();
    const thread = {
      programId: "program-1",
      programName: "METU Stars 2026",
      latest: announcement,
      announcements: [announcement],
    };
    mockMessages({
      announcements: myAnnouncementsStub({
        threads: [thread],
        openProgramId: "program-1",
        active: thread,
      }),
      openAnnouncements,
    });
    render(<MenteeMessagesView />);

    expect(
      screen.getByRole("heading", { name: "METU Stars 2026 — Duyuru" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Duyuru")).not.toBeInTheDocument();
    await user.click(
      within(screen.getByRole("complementary")).getByRole("button", {
        name: /METU Stars 2026 — Duyuru/,
      }),
    );
    expect(openAnnouncements).toHaveBeenCalledWith("program-1");
  });

  it("passes the thread a notification links to", () => {
    search = new URLSearchParams("conversation=conversation-1");
    mockMessages();
    render(<MenteeMessagesView />);

    expect(useMenteeMessages).toHaveBeenCalledWith("conversation-1");
  });
});
