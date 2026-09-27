import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProgramThreadList,
  ProgramThreadPane,
} from "@/components/program-threads";
import {
  coordinatorConversation,
  coordinatorMessage,
  programThreadsStub,
} from "@test/fixtures/coordinator-conversations";

const ACCENT = { strong: "#26a4ff", soft: "#f2f8fc" };

describe("ProgramThreadList", () => {
  it("renders nothing without program threads", () => {
    const { container } = render(
      <ProgramThreadList
        threads={programThreadsStub()}
        accent={ACCENT}
        onSelect={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each program thread with its coordinator and unread count", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ProgramThreadList
        threads={programThreadsStub({
          threads: [coordinatorConversation({ unreadCount: 2 })],
        })}
        accent={ACCENT}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Program")).toBeInTheDocument();
    expect(screen.getByText("Koordinatör · Elif Demir")).toBeInTheDocument();
    expect(screen.getByLabelText("2 okunmamış mesaj")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /METU Stars 2026/ }));
    expect(onSelect).toHaveBeenCalledWith("conversation-1");
  });
});

describe("ProgramThreadPane", () => {
  it("shows the thread with the sender of others' messages", () => {
    render(
      <ProgramThreadPane
        threads={programThreadsStub({
          active: coordinatorConversation(),
          messages: [
            coordinatorMessage({ senderName: "Elif Demir" }),
            coordinatorMessage({ id: "m2", mine: true, body: "Tamamdır." }),
          ],
        })}
        accent={ACCENT}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "METU Stars 2026" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Elif Demir/).length).toBeGreaterThan(1);
    expect(screen.getByText("Tamamdır.")).toBeInTheDocument();
  });

  it("sends from the composer and keeps Gönder disabled when it cannot", async () => {
    const user = userEvent.setup();
    const send = vi.fn();
    const { rerender } = render(
      <ProgramThreadPane
        threads={programThreadsStub({ active: coordinatorConversation() })}
        accent={ACCENT}
      />,
    );
    expect(screen.getByRole("button", { name: "Gönder" })).toBeDisabled();

    rerender(
      <ProgramThreadPane
        threads={programThreadsStub({
          active: coordinatorConversation(),
          draft: "Merhaba",
          canSend: true,
          send,
        })}
        accent={ACCENT}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(send).toHaveBeenCalled();
  });

  it("says when the thread is empty", () => {
    render(
      <ProgramThreadPane
        threads={programThreadsStub({ active: coordinatorConversation() })}
        accent={ACCENT}
      />,
    );
    expect(
      screen.getByText("Koordinatörle henüz mesaj yok."),
    ).toBeInTheDocument();
  });
});
