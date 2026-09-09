import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorMessagesPage from "@/app/mentor-dashboard/messages/page";
import { useMentorMessages } from "@/hooks/use-mentor-messages";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-messages", () => ({
  useMentorMessages: vi.fn(),
}));

const select = vi.fn();
const sendMessage = vi.fn().mockResolvedValue(undefined);
const shareFile = vi.fn().mockResolvedValue(undefined);

function conversation(id: string, organizationName: string) {
  return {
    id,
    organizationName,
    requesterName: id === "r1" ? "Gülse" : "Emir",
    supportArea: "İş modeli ve strateji",
    summary: "Değer önerisi ve onboarding",
    messages: [],
  };
}

function mock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMentorMessages).mockReturnValue({
    active: null,
    activeId: null,
    activeMeeting: null,
    conversations: [],
    error: null,
    fileUpload: {
      data: undefined,
      error: null,
      isPending: false,
      mutateAsync: shareFile,
    },
    isLoading: false,
    messageForm: {
      message: "",
      setMessage: vi.fn(),
      sendMessage,
      isSending: false,
      error: null,
    },
    select,
    viewerUserId: "mentor-1",
    ...overrides,
  } as unknown as ReturnType<typeof useMentorMessages>);
}

beforeEach(() => vi.clearAllMocks());

describe("MentorMessagesPage", () => {
  it("explains that messaging opens only after a request is accepted", () => {
    mock();
    render(<MentorMessagesPage />);

    expect(
      screen.getByRole("heading", { name: "Henüz mesajlaşma yok" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/talebini kabul ettiğinde konuşma burada açılır/),
    ).toBeInTheDocument();
  });

  it("lists accepted mentorships as conversations", () => {
    const first = conversation("r1", "GreenLoop");
    mock({
      conversations: [first, conversation("r2", "VeriKöprü")],
      activeId: "r1",
      active: first,
    });
    render(<MentorMessagesPage />);

    const list = within(screen.getByRole("list"));
    expect(list.getByText("Gülse · GreenLoop")).toBeInTheDocument();
    expect(list.getByText("Emir · VeriKöprü")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gülse · GreenLoop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("İlgili mentorluk")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mesaj yaz…")).toBeInTheDocument();
  });

  it("switches the open thread when another conversation is picked", async () => {
    const first = conversation("r1", "GreenLoop");
    mock({
      conversations: [first, conversation("r2", "VeriKöprü")],
      activeId: "r1",
      active: first,
    });
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.click(screen.getByText("Emir · VeriKöprü"));

    expect(select).toHaveBeenCalledWith("r2");
  });

  it("surfaces a load failure", () => {
    mock({ error: new Error("Talepler alınamadı.") });
    render(<MentorMessagesPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Talepler alınamadı.");
  });

  it("filters conversations by participant, organization, or context", async () => {
    const first = conversation("r1", "GreenLoop");
    mock({
      conversations: [first, conversation("r2", "VeriKöprü")],
      activeId: "r1",
      active: first,
    });
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.type(screen.getByRole("searchbox"), "VeriKöprü");

    const list = within(screen.getByRole("list"));
    expect(list.queryByText("Gülse · GreenLoop")).not.toBeInTheDocument();
    expect(list.getByText("Emir · VeriKöprü")).toBeInTheDocument();
  });

  it("sends messages and shares supported files from the active conversation", async () => {
    const active = {
      ...conversation("r1", "GreenLoop"),
      messages: [
        {
          id: "message-1",
          authorId: "mentee-1",
          authorName: "Gülse",
          body: "Yeni prototipi yükledim.",
          createdAt: "2026-09-09T08:00:00Z",
        },
        {
          id: "message-2",
          authorId: "mentee-1",
          authorName: "Gülse",
          body: "Dosya paylaşıldı: onboarding-notes.pdf",
          createdAt: "2026-09-09T08:05:00Z",
        },
      ],
    };
    mock({
      active,
      activeId: active.id,
      conversations: [active],
      messageForm: {
        message: "İki izlenimim var.",
        setMessage: vi.fn(),
        sendMessage,
        isSending: false,
        error: null,
      },
    });
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    expect(screen.getByText("Yeni prototipi yükledim.")).toBeInTheDocument();
    expect(screen.getByText("onboarding-notes.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(sendMessage).toHaveBeenCalledTimes(1);

    const file = new File(["notes"], "research-notes.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await user.upload(screen.getByLabelText("Mentorluk dosyası paylaş"), file);
    expect(shareFile).toHaveBeenCalledWith(file);
  });
});
