import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useMentorMessageForm,
  useRequestFileUpload,
  useReplyForm,
  useSlotBooking,
} from "@/hooks/use-mentorship-requests";
import { uploadDocument } from "@/lib/client/documents";
import {
  postMentorMessage,
  replyToMentorRequest,
  scheduleMeeting,
  type ScheduledMeeting,
} from "@/lib/client/mentor-requests";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-requests", () => ({
  postMentorMessage: vi.fn(),
  replyToMentorRequest: vi.fn(),
  scheduleMeeting: vi.fn(),
}));

vi.mock("@/lib/client/documents", () => ({
  uploadDocument: vi.fn(),
}));

function scheduledMeeting(
  overrides: Partial<ScheduledMeeting> = {},
): ScheduledMeeting {
  return {
    id: "meeting-1",
    mentorshipRequestId: "request-1",
    scheduledAt: "2026-08-26T08:00:00.000Z",
    durationMinutes: 60,
    meetLink: null,
    status: "SCHEDULED",
    ...overrides,
  };
}

function wrapperFor(queryClient: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useReplyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when the reply is empty or whitespace", async () => {
    const { result } = renderHook(() => useReplyForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setReply("   ");
    });

    await act(async () => {
      await result.current.sendReply();
    });

    expect(replyToMentorRequest).not.toHaveBeenCalled();
  });

  it("sends the trimmed reply and clears the field on success", async () => {
    vi.mocked(replyToMentorRequest).mockResolvedValue({
      id: "request-1",
    } as never);

    const { result } = renderHook(() => useReplyForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setReply("  Merhaba  ");
    });

    await act(async () => {
      await result.current.sendReply();
    });

    expect(replyToMentorRequest).toHaveBeenCalledWith({
      id: "request-1",
      message: "Merhaba",
    });
    expect(result.current.reply).toBe("");
  });

  it("does not clear the field when sending fails", async () => {
    vi.mocked(replyToMentorRequest).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useReplyForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setReply("Merhaba");
    });

    await act(async () => {
      await expect(result.current.sendReply()).rejects.toThrow();
    });

    expect(result.current.reply).toBe("Merhaba");
  });
});

describe("useSlotBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks a slot as scheduled after a successful booking", async () => {
    vi.mocked(scheduleMeeting).mockResolvedValue(scheduledMeeting());

    const { result } = renderHook(() => useSlotBooking("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    expect(result.current.scheduledSlotId).toBeNull();

    await act(async () => {
      await result.current.bookSlot("slot-1");
    });

    expect(scheduleMeeting).toHaveBeenCalledWith({
      id: "request-1",
      slotId: "slot-1",
    });
    expect(result.current.scheduledSlotId).toBe("slot-1");
  });

  it("resets the scheduled slot when the request id changes", async () => {
    vi.mocked(scheduleMeeting).mockResolvedValue(scheduledMeeting());
    const queryClient = createTestQueryClient();

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useSlotBooking(id),
      {
        wrapper: wrapperFor(queryClient),
        initialProps: { id: "request-1" },
      },
    );

    await act(async () => {
      await result.current.bookSlot("slot-1");
    });
    expect(result.current.scheduledSlotId).toBe("slot-1");

    rerender({ id: "request-2" });

    await waitFor(() => expect(result.current.scheduledSlotId).toBeNull());
  });
});

describe("useMentorMessageForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when the message is empty or whitespace", async () => {
    const { result } = renderHook(() => useMentorMessageForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setMessage("   ");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(postMentorMessage).not.toHaveBeenCalled();
  });

  it("sends the trimmed message and clears the field on success", async () => {
    vi.mocked(postMentorMessage).mockResolvedValue({
      id: "request-1",
    } as never);

    const { result } = renderHook(() => useMentorMessageForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setMessage("  Yarın uygun mu?  ");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(postMentorMessage).toHaveBeenCalledWith({
      id: "request-1",
      message: "Yarın uygun mu?",
    });
    expect(result.current.message).toBe("");
  });

  it("does not clear the field when sending fails", async () => {
    vi.mocked(postMentorMessage).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useMentorMessageForm("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setMessage("Merhaba");
    });

    await act(async () => {
      await expect(result.current.sendMessage()).rejects.toThrow();
    });

    expect(result.current.message).toBe("Merhaba");
  });
});

describe("useRequestFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the document and posts its filename to the conversation", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "document-1",
      kind: "pitch-deck",
      originalFilename: "financial-model.pdf",
      sizeBytes: 12,
    });
    vi.mocked(replyToMentorRequest).mockResolvedValue({
      id: "request-1",
    } as never);
    const file = new File(["financial data"], "financial-model.pdf", {
      type: "application/pdf",
    });
    const { result } = renderHook(() => useRequestFileUpload("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    expect(uploadDocument).toHaveBeenCalledWith(file, "pitch-deck");
    expect(replyToMentorRequest).toHaveBeenCalledWith({
      id: "request-1",
      message: "Dosya paylaşıldı: financial-model.pdf",
    });
  });
});
