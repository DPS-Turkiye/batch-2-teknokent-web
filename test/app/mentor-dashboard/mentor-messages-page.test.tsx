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
const sendMessage = vi.fn();

function conversation(id: string, organizationName: string) {
  return {
    id,
    organizationName,
    supportArea: "İş modeli ve strateji",
    messages: [],
  };
}

function mock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMentorMessages).mockReturnValue({
    active: null,
    activeId: null,
    conversations: [],
    error: null,
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
      screen.getByText(/kabul ettiğinizde, girişimle mesajlaşma/),
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
    expect(list.getByText("GreenLoop")).toBeInTheDocument();
    expect(list.getByText("VeriKöprü")).toBeInTheDocument();
    // The open thread is headed by the same organization.
    expect(
      screen.getByRole("heading", { name: "GreenLoop" }),
    ).toBeInTheDocument();
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

    await user.click(screen.getByText("VeriKöprü"));

    expect(select).toHaveBeenCalledWith("r2");
  });

  it("surfaces a load failure", () => {
    mock({ error: new Error("Talepler alınamadı.") });
    render(<MentorMessagesPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Talepler alınamadı.");
  });
});
