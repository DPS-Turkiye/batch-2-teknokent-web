import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useMentorNextMeeting } from "@/hooks/use-mentor-next-meeting";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { updateMeeting } from "@/lib/client/meetings";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meetings", () => ({ updateMeeting: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    organizationName: "Döngü",
    scheduledAt: "2026-09-18T11:00:00.000Z",
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

describe("useMentorNextMeeting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts from the saved link and offers it as the join target", () => {
    const { result } = renderHook(
      () => useMentorNextMeeting(meeting({ meetLink: "https://meet/abc" })),
      { wrapper },
    );

    expect(result.current.link).toBe("https://meet/abc");
    expect(result.current.joinHref).toBe("https://meet/abc");
  });

  it("saves a trimmed link when the field is left", async () => {
    vi.mocked(updateMeeting).mockResolvedValue(meeting());
    const { result } = renderHook(() => useMentorNextMeeting(meeting()), {
      wrapper,
    });

    act(() => result.current.setLink("  https://meet/new  "));
    await act(() => result.current.saveLink());

    expect(updateMeeting).toHaveBeenCalledWith("meeting-1", {
      meetLink: "https://meet/new",
    });
    expect(
      await screen.findByText("Görüşme linki kaydedildi."),
    ).toBeInTheDocument();
  });

  it("does not save a link that has not changed", async () => {
    const { result } = renderHook(
      () => useMentorNextMeeting(meeting({ meetLink: "https://meet/abc" })),
      { wrapper },
    );

    await act(() => result.current.saveLink());

    expect(updateMeeting).not.toHaveBeenCalled();
  });

  it("says why a save was refused", async () => {
    vi.mocked(updateMeeting).mockRejectedValue(new Error("Link geçersiz."));
    const { result } = renderHook(() => useMentorNextMeeting(meeting()), {
      wrapper,
    });

    act(() => result.current.setLink("https://meet/new"));
    await act(() => result.current.saveLink());

    expect(await screen.findByText("Link geçersiz.")).toBeInTheDocument();
  });

  it("turns the transcript on and off", async () => {
    vi.mocked(updateMeeting).mockResolvedValue(meeting());
    const { result } = renderHook(
      () => useMentorNextMeeting(meeting({ transcribeRequested: true })),
      { wrapper },
    );

    expect(result.current.transcribeRequested).toBe(true);
    await act(() => result.current.toggleTranscript());

    expect(updateMeeting).toHaveBeenCalledWith("meeting-1", {
      transcribeRequested: false,
    });
  });

  it("does nothing without a meeting", async () => {
    const { result } = renderHook(() => useMentorNextMeeting(undefined), {
      wrapper,
    });

    act(() => result.current.setLink("https://meet/new"));
    await act(() => result.current.saveLink());
    await act(() => result.current.toggleTranscript());

    expect(updateMeeting).not.toHaveBeenCalled();
    expect(result.current.joinHref).toBeNull();
  });
});
