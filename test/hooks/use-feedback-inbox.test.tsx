import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFeedbackInbox } from "@/hooks/use-feedback-inbox";
import {
  getPlatformFeedbackInbox,
  readPlatformFeedback,
} from "@/lib/client/platform-feedback";
import {
  feedbackInbox,
  platformFeedback,
} from "@test/fixtures/platform-feedback";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/platform-feedback", () => ({
  getPlatformFeedbackInbox: vi.fn(),
  readPlatformFeedback: vi.fn(),
}));

function setup() {
  const client = createTestQueryClient();
  return renderHook(() => useFeedbackInbox(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPlatformFeedbackInbox).mockResolvedValue(
    feedbackInbox({
      page: { ...feedbackInbox().page, totalElements: 21, totalPages: 2 },
    }),
  );
  vi.mocked(readPlatformFeedback).mockResolvedValue(
    platformFeedback({ readAt: "2026-11-05T12:00:00Z" }),
  );
});

describe("useFeedbackInbox", () => {
  it("paginates within bounds and resets the page when filtering unread", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getPlatformFeedbackInbox).toHaveBeenCalledWith(0, false, null);
    act(() => result.current.previous());
    expect(result.current.page).toBe(0);
    act(() => result.current.next());
    await waitFor(() =>
      expect(getPlatformFeedbackInbox).toHaveBeenCalledWith(1, false, null),
    );
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    act(() => result.current.next());
    expect(result.current.page).toBe(1);
    act(() => result.current.filterUnread(true));
    await waitFor(() =>
      expect(getPlatformFeedbackInbox).toHaveBeenCalledWith(0, true, null),
    );
    expect(result.current.page).toBe(0);
  });

  it("refreshes the inbox and unread count after a message is read", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data?.unreadCount).toBe(1));
    vi.mocked(getPlatformFeedbackInbox).mockResolvedValue(
      feedbackInbox({ unreadCount: 0 }),
    );
    act(() => result.current.markRead(platformFeedback().id));
    await waitFor(() => expect(result.current.data?.unreadCount).toBe(0));
    expect(readPlatformFeedback).toHaveBeenCalledWith(
      platformFeedback().id,
      expect.anything(),
    );
  });

  it("exposes a failed read without dropping the inbox", async () => {
    vi.mocked(readPlatformFeedback).mockRejectedValue(new Error("offline"));
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeDefined());
    act(() => result.current.markRead(platformFeedback().id));
    await waitFor(() => expect(result.current.readError).toBeInstanceOf(Error));
    expect(result.current.data?.page.content).toHaveLength(1);
    expect(result.current.isMarkingRead).toBe(false);
  });
});
