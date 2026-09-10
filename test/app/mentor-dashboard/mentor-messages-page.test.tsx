import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MentorMessagesPage from "@/app/mentor-dashboard/messages/page";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function conversationList() {
  return screen.getByRole("complementary");
}

describe("MentorMessagesPage", () => {
  it("introduces the messaging workspace", () => {
    render(<MentorMessagesPage />);

    expect(
      screen.getByRole("heading", { name: "Mesajlar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Konuşmalar" }),
    ).toBeInTheDocument();
  });

  it("lists every conversation with its mentorship context", () => {
    render(<MentorMessagesPage />);

    const list = conversationList();
    expect(within(list).getAllByRole("button")).toHaveLength(4);
    expect(within(list).getByText("Gülse Buran")).toBeInTheDocument();
    expect(
      within(list).getByText("Döngü · Product & UX Design"),
    ).toBeInTheDocument();
    expect(within(list).getByText("Türkan Yalçın")).toBeInTheDocument();
  });

  it("asks for a conversation before opening a thread", () => {
    render(<MentorMessagesPage />);

    expect(
      screen.getByRole("heading", { name: "Bir konuşma seç" }),
    ).toBeInTheDocument();
  });

  it("filters conversations by participant name", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "Emir",
    );

    const list = conversationList();
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    expect(within(list).getByText("Emir Kaplan")).toBeInTheDocument();
  });

  it("filters conversations by startup context", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "NovaTech",
    );

    const list = conversationList();
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    expect(within(list).getByText("Deniz Arslan")).toBeInTheDocument();
  });

  it("matches the search case-insensitively for Turkish input", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "türkan",
    );

    expect(
      within(conversationList()).getByText("Türkan Yalçın"),
    ).toBeInTheDocument();
  });

  it("leaves the list empty when nothing matches", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.type(
      screen.getByPlaceholderText("Mentee veya startup ara"),
      "eşleşmeyen",
    );

    expect(within(conversationList()).queryAllByRole("button")).toHaveLength(0);
  });

  it("opens a thread when a conversation is picked", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.click(
      within(conversationList()).getByRole("button", { name: /Gülse Buran/ }),
    );

    expect(
      screen.queryByRole("heading", { name: "Bir konuşma seç" }),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mesaj yaz…")).toBeInTheDocument();
  });

  it("starts a thread from the empty state", async () => {
    const user = userEvent.setup();
    render(<MentorMessagesPage />);

    await user.click(screen.getByRole("button", { name: "Yeni mesaj başlat" }));

    expect(screen.getByPlaceholderText("Mesaj yaz…")).toBeInTheDocument();
  });
});
