import { act, renderHook } from "@testing-library/react";
import type { FormEvent, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePlatformFeedback } from "@/hooks/use-platform-feedback";
import {
  FeedbackSubmitError,
  PlatformFeedbackKind,
} from "@/interfaces/platform-feedback";
import { ClientApiError } from "@/lib/client/api";
import { submitPlatformFeedback } from "@/lib/client/platform-feedback";
import {
  FEEDBACK_MESSAGE_LIMIT,
  FEEDBACK_SUBJECT_LIMIT,
} from "@/lib/platform-feedback";
import { platformFeedback } from "@test/fixtures/platform-feedback";
import { InLocale } from "@test/test-utils";

vi.mock("@/lib/client/platform-feedback", () => ({
  submitPlatformFeedback: vi.fn(),
}));

const event = () =>
  new Event("submit", {
    cancelable: true,
  }) as unknown as FormEvent<HTMLFormElement>;

function fill(result: { current: ReturnType<typeof usePlatformFeedback> }) {
  act(() => {
    result.current.setKind(PlatformFeedbackKind.Suggestion);
    result.current.setSubject("  Calendar shortcut  ");
    result.current.setMessage("  Please add a shortcut.  ");
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitPlatformFeedback).mockResolvedValue(platformFeedback());
});

describe("usePlatformFeedback", () => {
  it("keeps a draft when the tray is closed and reopened", () => {
    const { result } = renderHook(() => usePlatformFeedback());
    act(() => result.current.open());
    fill(result);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.subject).toBe("  Calendar shortcut  ");
    expect(result.current.kind).toBe(PlatformFeedbackKind.Suggestion);
  });

  it("rejects blank and oversized submissions without making a request", async () => {
    const { result } = renderHook(() => usePlatformFeedback());
    const submitEvent = event();
    await act(() => result.current.submit(submitEvent));
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(result.current.subjectRequired).toBe(true);
    expect(result.current.messageRequired).toBe(true);
    fill(result);
    act(() =>
      result.current.setSubject("x".repeat(FEEDBACK_SUBJECT_LIMIT + 1)),
    );
    expect(result.current.canSubmit).toBe(false);
    await act(() => result.current.submit(event()));
    act(() => {
      result.current.setSubject("Valid subject");
      result.current.setMessage("x".repeat(FEEDBACK_MESSAGE_LIMIT + 1));
    });
    await act(() => result.current.submit(event()));
    expect(submitPlatformFeedback).not.toHaveBeenCalled();
  });

  it("sends trimmed text and the selected language, then clears the successful draft", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <InLocale locale="en">{children}</InLocale>
    );
    const { result } = renderHook(() => usePlatformFeedback(), { wrapper });
    fill(result);
    await act(() => result.current.submit(event()));

    expect(submitPlatformFeedback).toHaveBeenCalledWith({
      kind: PlatformFeedbackKind.Suggestion,
      subject: "Calendar shortcut",
      message: "Please add a shortcut.",
      language: "en",
    });
    expect(result.current.submitted).toBe(true);
    expect(result.current.subject).toBe("");
    expect(result.current.message).toBe("");
    act(() => result.current.open());
    expect(result.current.submitted).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  it.each([
    [new Error("offline"), FeedbackSubmitError.Failed],
    [new ClientApiError("expired", 401), FeedbackSubmitError.SessionRequired],
    [new ClientApiError("limited", 429), FeedbackSubmitError.RateLimited],
  ])(
    "preserves the draft after a submission failure (%s)",
    async (error, expected) => {
      vi.mocked(submitPlatformFeedback).mockRejectedValueOnce(error);
      const { result } = renderHook(() => usePlatformFeedback());
      fill(result);
      await act(() => result.current.submit(event()));
      expect(result.current.error).toBe(expected);
      expect(result.current.message).toBe("  Please add a shortcut.  ");
      expect(result.current.canSubmit).toBe(true);
      await act(() => result.current.submit(event()));
      expect(result.current.error).toBeNull();
      expect(result.current.submitted).toBe(true);
    },
  );

  it("prevents duplicate requests even before React rerenders", async () => {
    let finish!: (value: ReturnType<typeof platformFeedback>) => void;
    vi.mocked(submitPlatformFeedback).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => usePlatformFeedback());
    fill(result);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit(event());
      void result.current.submit(event());
    });
    expect(submitPlatformFeedback).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.canSubmit).toBe(false);
    await act(async () => {
      finish(platformFeedback());
      await pending;
    });
  });
});
