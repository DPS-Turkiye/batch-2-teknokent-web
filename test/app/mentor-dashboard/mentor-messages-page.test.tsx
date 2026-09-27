import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorMessagesPage from "@/app/mentor-dashboard/messages/page";
import { useMentorMessages } from "@/hooks/use-mentor-messages";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  coordinatorConversation,
  coordinatorMessage,
  programThreadsStub,
} from "@test/fixtures/coordinator-conversations";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-messages", () => ({
  useMentorMessages: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const VIEWER = "mentor-1";

function conversation(
  id: string,
  organizationName: string,
  requesterName: string,
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id,
    requesterId: `mentee-${id}`,
    requesterName,
    organizationId: `org-${id}`,
    organizationName,
    mentorId: VIEWER,
    mentorName: "Nihan Öztürk",
    supportArea: "Product & UX Design",
    summary: "Onboarding akışı",
    status: MentorshipRequestStatus.Accepted,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-08T09:00:00.000Z",
    messages: [
      {
        id: `${id}-m1`,
        authorId: `mentee-${id}`,
        authorName: requesterName,
        messageType: MentorshipRequestMessageType.MenteeMessage,
        body: "Yeni prototipi yükledim.",
        createdAt: "2026-09-08T09:58:00.000Z",
      },
      {
        id: `${id}-m2`,
        authorId: VIEWER,
        authorName: "Nihan",
        messageType: MentorshipRequestMessageType.MentorMessage,
        body: "Baktım, yarın konuşalım.",
        createdAt: "2026-09-08T10:06:00.000Z",
      },
    ],
    recommendationSnapshot: null,
    ...overrides,
  };
}

const select = vi.fn();
const sendMessage = vi.fn().mockResolvedValue(undefined);
const setMessage = vi.fn();
const shareFile = vi.fn().mockResolvedValue(undefined);

function meeting(): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-r1",
    scheduledAt: "2026-09-14T11:00:00.000Z",
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
  };
}

function mockMessages(overrides: Record<string, unknown> = {}) {
  const conversations = [
    conversation("r1", "Döngü", "Gülse Buran"),
    conversation("r2", "Atlas AI", "Emir Kaplan"),
  ];
  const value = {
    active: conversations[0],
    activeId: "r1",
    activeMeeting: meeting(),
    meetingLabel: "Sonraki görüşme 14 Eyl · 14:00",
    conversations,
    error: null,
    fileUpload: { isPending: false, mutateAsync: shareFile },
    isLoading: false,
    messageForm: {
      message: "",
      setMessage,
      sendMessage,
      isSending: false,
      error: null,
    },
    programThreads: programThreadsStub(),
    select,
    viewerUserId: VIEWER,
    ...overrides,
  };
  vi.mocked(useMentorMessages).mockReturnValue(
    value as unknown as ReturnType<typeof useMentorMessages>,
  );
  return value;
}

function list() {
  return screen.getByRole("complementary");
}

describe("MentorMessagesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists accepted mentorships as conversations", () => {
    mockMessages();
    render(<MentorMessagesPage />);

    expect(within(list()).getByText("Gülse Buran")).toBeInTheDocument();
    expect(
      within(list()).getByText("Döngü · Product & UX Design"),
    ).toBeInTheDocument();
    expect(within(list()).getByText("Emir Kaplan")).toBeInTheDocument();
  });

  it("previews the latest message in each conversation", () => {
    mockMessages();
    render(<MentorMessagesPage />);

    expect(
      within(list()).getAllByText("Baktım, yarın konuşalım.").length,
    ).toBeGreaterThan(0);
  });

  it("explains when there are no open conversations yet", () => {
    mockMessages({ conversations: [], active: null, activeId: null });
    render(<MentorMessagesPage />);

    expect(
      screen.getByText(
        "Açık bir mentorluk talebi olunca konuşmalar burada görünür.",
      ),
    ).toBeInTheDocument();
  });

  it("reports a load failure", () => {
    mockMessages({ error: new Error("Konuşmalar yüklenemedi.") });
    render(<MentorMessagesPage />);

    expect(screen.getByText("Konuşmalar yüklenemedi.")).toBeInTheDocument();
  });

  it("filters conversations by participant or startup", async () => {
    const user = userEvent.setup();
    mockMessages();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "Atlas",
    );

    expect(within(list()).getByText("Emir Kaplan")).toBeInTheDocument();
    expect(within(list()).queryByText("Gülse Buran")).not.toBeInTheDocument();
  });

  it("says when the search matches nothing", async () => {
    const user = userEvent.setup();
    mockMessages();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "eşleşmeyen",
    );

    expect(
      screen.getByText("Aramanla eşleşen konuşma yok."),
    ).toBeInTheDocument();
  });

  it("switches the open thread when another conversation is picked", async () => {
    const user = userEvent.setup();
    mockMessages();
    render(<MentorMessagesPage />);

    await user.click(
      within(list()).getByRole("button", { name: /Emir Kaplan/ }),
    );

    expect(select).toHaveBeenCalledWith("r2");
  });

  it("renders the thread and marks the mentor's own messages", () => {
    mockMessages();
    render(<MentorMessagesPage />);

    expect(screen.getByText("Yeni prototipi yükledim.")).toBeInTheDocument();
    const own = screen.getAllByText("Baktım, yarın konuşalım.");
    expect(own.length).toBeGreaterThan(0);
  });

  it("shows the linked mentorship and its next meeting", () => {
    mockMessages();
    render(<MentorMessagesPage />);

    expect(screen.getByText(/İlgili mentorluk · Döngü/)).toBeInTheDocument();
    expect(
      screen.getByText("Sonraki görüşme 14 Eyl · 14:00"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluk detayına git →" }),
    ).toHaveAttribute("href", "/mentor-dashboard/mentorship/r1");
  });

  it("notes when the mentorship has no meeting planned", () => {
    mockMessages({ activeMeeting: null, meetingLabel: null });
    render(<MentorMessagesPage />);

    expect(screen.getByText("Planlanmış görüşme yok")).toBeInTheDocument();
  });

  it("sends a message from the composer", async () => {
    const user = userEvent.setup();
    mockMessages({
      messageForm: {
        message: "Yarın 11:00 uygun.",
        setMessage,
        sendMessage,
        isSending: false,
        error: null,
      },
    });
    render(<MentorMessagesPage />);

    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(sendMessage).toHaveBeenCalled();
  });

  it("keeps Gönder disabled while the message is empty", () => {
    mockMessages();
    render(<MentorMessagesPage />);

    expect(screen.getByRole("button", { name: "Gönder" })).toBeDisabled();
  });

  it("shares a file into the active conversation", async () => {
    const user = userEvent.setup();
    mockMessages();
    render(<MentorMessagesPage />);

    const file = new File(["x"], "onboarding-v4.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Dosya seç"), file);

    expect(shareFile).toHaveBeenCalledWith(file);
  });

  it("lists coordinator threads and opens one in place of the mentorship", () => {
    const thread = coordinatorConversation();
    mockMessages({
      programThreads: programThreadsStub({
        threads: [thread],
        openId: thread.id,
        active: thread,
        messages: [coordinatorMessage({ body: "Program duyurusu" })],
      }),
    });
    render(<MentorMessagesPage />);

    expect(
      within(list()).getByRole("button", { name: /METU Stars 2026/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Program duyurusu")).toBeInTheDocument();
    expect(
      screen.queryByText("Yeni prototipi yükledim."),
    ).not.toBeInTheDocument();
  });

  it("prompts for a conversation when none is open", () => {
    mockMessages({ active: null, activeId: null });
    render(<MentorMessagesPage />);

    expect(
      screen.getByRole("heading", { name: "Bir konuşma seç" }),
    ).toBeInTheDocument();
  });
});
