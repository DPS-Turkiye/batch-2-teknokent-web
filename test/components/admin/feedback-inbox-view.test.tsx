import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackInboxView } from "@/components/admin/feedback-inbox-view";
import {
  getPlatformFeedbackInbox,
  readPlatformFeedback,
} from "@/lib/client/platform-feedback";
import {
  feedbackInbox,
  platformFeedback,
} from "@test/fixtures/platform-feedback";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/platform-feedback", () => ({
  getPlatformFeedbackInbox: vi.fn(),
  readPlatformFeedback: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPlatformFeedbackInbox).mockResolvedValue(feedbackInbox());
  vi.mocked(readPlatformFeedback).mockResolvedValue(
    platformFeedback({ readAt: "2026-11-05T12:00:00Z" }),
  );
});

describe("FeedbackInboxView", () => {
  it("shows sender, category, submission language and unread state, then marks a message read", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<FeedbackInboxView />);
    expect(
      await screen.findByRole("heading", { name: "Calendar shortcut" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Öneri")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Gönderim dili: İngilizce")).toBeInTheDocument();
    expect(screen.getByText("1 okunmamış mesaj")).toBeInTheDocument();
    vi.mocked(getPlatformFeedbackInbox).mockResolvedValue(
      feedbackInbox({
        unreadCount: 0,
        page: {
          ...feedbackInbox().page,
          content: [platformFeedback({ readAt: "2026-11-05T12:00:00Z" })],
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Okundu işaretle" }));
    expect(await screen.findByText("Okundu")).toBeInTheDocument();
    expect(screen.getByText("0 okunmamış mesaj")).toBeInTheDocument();
  });

  it("shows the English empty state and lets admins filter unread", async () => {
    vi.mocked(getPlatformFeedbackInbox).mockResolvedValue(
      feedbackInbox({
        unreadCount: 0,
        page: {
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        },
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <FeedbackInboxView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { name: "No messages yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Feedback inbox" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", { name: "Unread messages only" }),
    );
    expect(
      await screen.findByRole("heading", { name: "You’re all caught up" }),
    ).toBeInTheDocument();
    expect(getPlatformFeedbackInbox).toHaveBeenCalledWith(0, true);
  });

  it("shows a translated loading failure and recovers using Refresh", async () => {
    vi.mocked(getPlatformFeedbackInbox).mockRejectedValueOnce(
      new Error("offline"),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <FeedbackInboxView />
      </InLocale>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Feedback could not be loaded.",
    );
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Calendar shortcut" }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
