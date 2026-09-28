import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramThreads } from "@/hooks/use-program-threads";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/client/coordinator-conversations";
import {
  coordinatorConversation,
  coordinatorMessage,
} from "@test/fixtures/coordinator-conversations";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-conversations", () => ({
  getCoordinatorConversations: vi.fn(),
  getCoordinatorMessages: vi.fn(),
  sendCoordinatorMessage: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useProgramThreads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorConversations).mockResolvedValue([
      coordinatorConversation(),
    ]);
    vi.mocked(getCoordinatorMessages).mockResolvedValue([coordinatorMessage()]);
    vi.mocked(sendCoordinatorMessage).mockResolvedValue(
      coordinatorMessage({ id: "message-2", mine: true }),
    );
  });

  it("lists the threads and loads messages only once one is opened", async () => {
    const { result } = renderHook(() => useProgramThreads(), { wrapper });

    await waitFor(() => expect(result.current.threads).toHaveLength(1));
    expect(result.current.active).toBeNull();
    expect(getCoordinatorMessages).not.toHaveBeenCalled();

    act(() => result.current.open("conversation-1"));

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(getCoordinatorMessages).toHaveBeenCalledWith("conversation-1");
    expect(result.current.active?.programName).toBe("METU Stars 2026");
  });

  it("sends the trimmed draft and clears it", async () => {
    const { result } = renderHook(() => useProgramThreads(), { wrapper });
    await waitFor(() => expect(result.current.threads).toHaveLength(1));
    act(() => result.current.open("conversation-1"));
    expect(result.current.canSend).toBe(false);

    act(() => result.current.setDraft("  Merhaba  "));
    expect(result.current.canSend).toBe(true);
    act(() => result.current.send());

    await waitFor(() => expect(result.current.draft).toBe(""));
    expect(sendCoordinatorMessage).toHaveBeenCalledWith(
      "conversation-1",
      "Merhaba",
    );
  });

  it("closes the open thread", async () => {
    const { result } = renderHook(() => useProgramThreads(), { wrapper });
    await waitFor(() => expect(result.current.threads).toHaveLength(1));

    act(() => result.current.open("conversation-1"));
    act(() => result.current.close());

    expect(result.current.active).toBeNull();
  });

  it("opens the thread a notification links to, and follows a new link", async () => {
    const { result, rerender } = renderHook(
      ({ linked }: { linked: string | null }) => useProgramThreads(linked),
      { wrapper, initialProps: { linked: "conversation-1" } },
    );

    await waitFor(() =>
      expect(result.current.active?.id).toBe("conversation-1"),
    );
    expect(getCoordinatorMessages).toHaveBeenCalledWith("conversation-1");

    act(() => result.current.close());
    rerender({ linked: "conversation-2" });
    expect(result.current.openId).toBe("conversation-2");
  });
});
