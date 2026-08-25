import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConversationThread } from "@/components/mentorship/conversation-thread";
import {
  MentorshipRequestMessageType,
  type RequestMessage,
} from "@/interfaces/mentorship-request";

function message(overrides: Partial<RequestMessage> = {}): RequestMessage {
  return {
    id: "message-1",
    authorId: "mentor-1",
    authorName: "Leyla Aksoy",
    messageType: MentorshipRequestMessageType.MentorMessage,
    body: "Yarın 14:00 uygun mu?",
    createdAt: "2026-08-25T09:00:00.000Z",
    ...overrides,
  };
}

describe("ConversationThread", () => {
  it("shows an empty state when there are no messages", () => {
    render(
      <ConversationThread
        messages={[]}
        viewerUserId="mentor-1"
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
        isSending={false}
      />,
    );

    expect(screen.getByText("Henüz mesaj yok.")).toBeInTheDocument();
  });

  it("renders every message with its author and body", () => {
    render(
      <ConversationThread
        messages={[
          message({ id: "1", authorId: "mentor-1", body: "Yarın uygun mu?" }),
          message({
            id: "2",
            authorId: "requester-1",
            authorName: "Ayşe Demir",
            body: "Evet, uygun",
          }),
        ]}
        viewerUserId="mentor-1"
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
        isSending={false}
      />,
    );

    expect(screen.getByText("Yarın uygun mu?")).toBeInTheDocument();
    expect(screen.getByText("Evet, uygun")).toBeInTheDocument();
    expect(screen.getByText("Ayşe Demir")).toBeInTheDocument();
  });

  it("calls onChange as the composer is typed into", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ConversationThread
        messages={[]}
        viewerUserId="mentor-1"
        value=""
        onChange={onChange}
        onSend={vi.fn()}
        isSending={false}
      />,
    );

    await user.type(screen.getByPlaceholderText("Mesajınızı yazın..."), "x");

    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("disables sending until there is content, then calls onSend", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(
      <ConversationThread
        messages={[]}
        viewerUserId="mentor-1"
        value="Merhaba"
        onChange={vi.fn()}
        onSend={onSend}
        isSending={false}
      />,
    );

    await user.click(screen.getByText("Gönder"));
    expect(onSend).toHaveBeenCalled();
  });

  it("shows the send error when present", () => {
    render(
      <ConversationThread
        messages={[]}
        viewerUserId="mentor-1"
        value="Merhaba"
        onChange={vi.fn()}
        onSend={vi.fn()}
        isSending={false}
        error={new Error("Mesaj gönderilemedi")}
      />,
    );

    expect(screen.getByText("Mesaj gönderilemedi")).toBeInTheDocument();
  });
});
