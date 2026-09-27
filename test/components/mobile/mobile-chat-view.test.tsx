import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileChatView } from "@/components/mobile/mobile-chat-view";
import type { useMobileChat } from "@/hooks/use-mobile-chat";
import {
  MobileChatItemKind,
  MobileConversationKind,
} from "@/interfaces/mobile";

type Chat = ReturnType<typeof useMobileChat>;

const submit = vi.fn();
const setDraft = vi.fn();
const attach = vi.fn();
let chat: Chat;

vi.mock("@/hooks/use-mobile-chat", () => ({
  MAX_CHAT_MESSAGE_LENGTH: 4000,
  useMobileChat: () => chat,
}));

function chatState(overrides: Partial<Chat> = {}): Chat {
  return {
    backHref: "/m/messages",
    canAttach: true,
    canSend: true,
    closedNote: "Bu konuşma kapandı; yeni mesaj gönderilemez.",
    attach,
    draft: "Merhaba",
    header: {
      name: "Nihan Öztürk",
      initials: "NÖ",
      subtitle: "Mentor · Ürün stratejisi",
      isStartup: false,
    },
    topics: [],
    isError: false,
    isLoading: false,
    isSending: false,
    isUploading: false,
    items: [
      { kind: MobileChatItemKind.Day, id: "day-1", label: "Bugün" },
      {
        kind: MobileChatItemKind.Message,
        id: "m1",
        mine: true,
        body: "Dosya paylaşıldı: akis.pdf",
        fileName: "akis.pdf",
        time: "09:12",
        read: true,
      },
      {
        kind: MobileChatItemKind.Message,
        id: "m2",
        mine: false,
        body: "İnceledim, iki önerim var.",
        fileName: null,
        time: "09:40",
        read: false,
      },
    ],
    notFound: false,
    retry: vi.fn(),
    sendError: false,
    setDraft,
    strip: {
      label: "Sıradaki görüşme: Yarın 14:00",
      href: "/m/calendar?meeting=m",
    },
    submit,
    ...overrides,
  };
}

function renderChat() {
  return render(
    <MobileChatView kind={MobileConversationKind.Mentorship} id="r1" />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  chat = chatState();
});

describe("MobileChatView", () => {
  it("shows who the thread is with, the next meeting and a way back", () => {
    renderChat();

    expect(
      screen.getByRole("heading", { name: "Nihan Öztürk" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentor · Ürün stratejisi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mesajlara dön" })).toHaveAttribute(
      "href",
      "/m/messages",
    );
    expect(screen.getByRole("link", { name: "Detay" })).toHaveAttribute(
      "href",
      "/m/calendar?meeting=m",
    );
  });

  it("renders the day, a shared file with a read tick and the other side's message", () => {
    renderChat();

    const list = screen.getByRole("list", { name: "Mesajlar" });
    expect(within(list).getByText("Bugün")).toBeInTheDocument();
    expect(within(list).getByText("akis.pdf")).toBeInTheDocument();
    expect(within(list).getAllByAltText("Okundu")).toHaveLength(1);
    expect(
      within(list).getByText("İnceledim, iki önerim var."),
    ).toBeInTheDocument();
  });

  it("sends the draft from the composer", async () => {
    renderChat();

    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));

    expect(submit).toHaveBeenCalled();
  });

  it("keeps Gönder disabled for an empty draft", () => {
    chat = chatState({ draft: "   " });
    renderChat();

    expect(screen.getByRole("button", { name: "Gönder" })).toBeDisabled();
  });

  it("uploads a picked file", async () => {
    renderChat();
    const file = new File(["x"], "plan.pdf", { type: "application/pdf" });

    await userEvent.upload(
      screen.getByRole("button", { name: "Dosya ekle" })
        .nextElementSibling as HTMLInputElement,
      file,
    );

    expect(attach).toHaveBeenCalledWith(file);
  });

  it("has no attach button in a program thread", () => {
    chat = chatState({ canAttach: false });
    renderChat();

    expect(
      screen.queryByRole("button", { name: "Dosya ekle" }),
    ).not.toBeInTheDocument();
  });

  it("explains a closed conversation instead of the composer", () => {
    chat = chatState({ canSend: false });
    renderChat();

    expect(
      screen.getByText("Bu konuşma kapandı; yeni mesaj gönderilemez."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gönder" })).toBeNull();
  });

  it("offers the other topics with the same mentor as tabs", () => {
    chat = chatState({
      topics: [
        {
          id: "r1",
          topic: "Ürün stratejisi",
          unreadCount: 0,
          href: "/m/messages/mentorship/r1",
          isCurrent: true,
        },
        {
          id: "r2",
          topic: "Yatırım",
          unreadCount: 2,
          href: "/m/messages/mentorship/r2",
          isCurrent: false,
        },
      ],
    });
    renderChat();

    const topics = screen.getByRole("navigation", { name: "Konular" });
    expect(
      within(topics).getByRole("link", { name: "Ürün stratejisi" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(topics).getByRole("link", { name: /Yatırım/ }),
    ).toHaveAttribute("href", "/m/messages/mentorship/r2");
  });

  it("says when the thread cannot be found", () => {
    chat = chatState({ header: null, items: [], notFound: true });
    renderChat();

    expect(screen.getByText("Konuşma bulunamadı.")).toBeInTheDocument();
  });

  it("heads a mentor's startup thread with a square startup avatar", () => {
    chat = chatState({
      header: {
        name: "Atlas AI",
        initials: "AA",
        subtitle: "METU Stars 2026 · Gamze Kozak",
        isStartup: true,
      },
    });
    renderChat();

    expect(screen.getByText("AA")).toHaveClass("rounded-[13px]");
    expect(screen.getByText("METU Stars 2026 · Gamze Kozak")).toHaveClass(
      "text-[#e0522a]",
    );
  });

  it("reports a failed send", () => {
    chat = chatState({ sendError: true });
    renderChat();

    expect(screen.getByRole("alert")).toHaveTextContent("Mesaj gönderilemedi.");
  });
});
