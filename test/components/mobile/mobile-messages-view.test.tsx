import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileMessagesView } from "@/components/mobile/mobile-messages-view";
import type { useMobileMessages } from "@/hooks/use-mobile-messages";
import {
  MobileConversationKind,
  type MobileConversation,
} from "@/interfaces/mobile";

type Messages = ReturnType<typeof useMobileMessages>;

const setQuery = vi.fn();
const retry = vi.fn();
let state: Messages;

vi.mock("@/hooks/use-mobile-messages", () => ({
  useMobileMessages: () => state,
}));

const MENTOR: MobileConversation = {
  id: "r1",
  kind: MobileConversationKind.Mentorship,
  name: "Nihan Öztürk",
  initials: "NÖ",
  tag: "Mentor",
  isStartup: false,
  lastAt: "2026-09-25T09:00:00Z",
  time: "12:00",
  preview: "Yeni dosyayı inceledim",
  unreadCount: 2,
  href: "/m/messages/mentorship/r1",
};

const PROGRAM: MobileConversation = {
  id: "p1",
  kind: MobileConversationKind.Program,
  name: "METU Stars",
  initials: "MS",
  tag: "Program",
  isStartup: false,
  lastAt: "2026-09-22T09:00:00Z",
  time: "Pzt",
  preview: "Ara rapor teslimi yaklaşıyor.",
  unreadCount: 0,
  href: "/m/messages/program/p1",
};

function messagesState(overrides: Partial<Messages> = {}): Messages {
  return {
    conversations: [MENTOR, PROGRAM],
    shown: [MENTOR, PROGRAM],
    isError: false,
    isLoading: false,
    isMentor: false,
    searchLabel: "Kişi ara",
    query: "",
    retry,
    setQuery,
    unreadTotal: 2,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state = messagesState();
});

describe("MobileMessagesView", () => {
  it("lists each thread with its tag and links into the chat", () => {
    render(<MobileMessagesView />);

    const list = screen.getByRole("list", { name: "Konuşmalar" });
    const rows = within(list).getAllByRole("link");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute("href", "/m/messages/mentorship/r1");
    expect(rows[0]).toHaveTextContent("· Mentor");
    expect(rows[1]).toHaveTextContent("· Program");
  });

  it("badges only the threads with unread messages", () => {
    render(<MobileMessagesView />);

    expect(screen.getByLabelText("2 okunmamış mesaj")).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/okunmamış mesaj/)).toHaveLength(1);
  });

  it("passes what is typed into the search", async () => {
    render(<MobileMessagesView />);

    await userEvent.type(screen.getByPlaceholderText("Kişi ara"), "N");

    expect(setQuery).toHaveBeenCalledWith("N");
  });

  it("says when the search matches nothing", () => {
    state = messagesState({ query: "zz", shown: [] });
    render(<MobileMessagesView />);

    expect(
      screen.getByText("“zz” ile eşleşen konuşma yok."),
    ).toBeInTheDocument();
  });

  it("explains an empty inbox", () => {
    state = messagesState({ conversations: [], shown: [] });
    render(<MobileMessagesView />);

    expect(screen.getByText("Henüz mesajın yok")).toBeInTheDocument();
  });

  it("offers a retry when both sources fail", async () => {
    state = messagesState({ isError: true });
    render(<MobileMessagesView />);

    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(retry).toHaveBeenCalled();
  });

  it("shows mentors startups with square avatars and the person who wrote", () => {
    const startup: MobileConversation = {
      ...MENTOR,
      name: "Atlas AI",
      initials: "AA",
      tag: "Gamze Kozak",
      isStartup: true,
    };
    state = messagesState({
      conversations: [startup],
      shown: [startup],
      isMentor: true,
      searchLabel: "Startup veya kişi ara",
    });
    render(<MobileMessagesView />);

    expect(
      screen.getByPlaceholderText("Startup veya kişi ara"),
    ).toBeInTheDocument();
    const row = screen.getByRole("link", { name: /Atlas AI/ });
    expect(within(row).getByText("AA")).toHaveClass("rounded-2xl");
    expect(within(row).getByText("· Gamze Kozak")).toHaveClass(
      "text-[#e0522a]",
    );
    expect(within(row).getByText("12:00")).toHaveClass("text-[#1583d6]");
    // A long requester name shortens before the startup name does.
    expect(within(row).getByText("Atlas AI")).toHaveClass("shrink-0");
    expect(within(row).getByText("· Gamze Kozak")).toHaveClass("truncate");
  });
});
