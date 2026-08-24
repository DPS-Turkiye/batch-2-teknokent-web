import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useLogMeeting,
  useLogMeetingForm,
  useMeetingNoteForm,
  useMentorshipMeetings,
  useUpdateMeeting,
} from "@/hooks/use-mentorship-timeline";
import {
  getMentorshipMeetings,
  logMentorshipMeeting,
} from "@/lib/client/mentor-requests";
import { updateMeeting } from "@/lib/client/meetings";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorshipMeetings: vi.fn(),
  logMentorshipMeeting: vi.fn(),
}));

vi.mock("@/lib/client/meetings", () => ({
  updateMeeting: vi.fn(),
}));

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    scheduledAt: "2026-08-15T10:00:00.000Z",
    durationMinutes: 45,
    status: MeetingStatus.Completed,
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

describe("useMentorshipMeetings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when no request id is set", () => {
    vi.mocked(getMentorshipMeetings).mockResolvedValue([]);

    renderHook(() => useMentorshipMeetings(null), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    expect(getMentorshipMeetings).not.toHaveBeenCalled();
  });

  it("fetches the timeline for a given request id", async () => {
    vi.mocked(getMentorshipMeetings).mockResolvedValue([meeting()]);

    const { result } = renderHook(() => useMentorshipMeetings("request-1"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([meeting()]);
    expect(getMentorshipMeetings).toHaveBeenCalledWith("request-1");
  });
});

describe("useLogMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refetches the timeline after logging a meeting", async () => {
    vi.mocked(getMentorshipMeetings).mockResolvedValue([]);
    vi.mocked(logMentorshipMeeting).mockResolvedValue(meeting());
    const queryClient = createTestQueryClient();
    const wrapper = wrapperFor(queryClient);

    const meetings = renderHook(() => useMentorshipMeetings("request-1"), {
      wrapper,
    });
    await waitFor(() => expect(meetings.result.current.isLoading).toBe(false));

    const logMeeting = renderHook(() => useLogMeeting("request-1"), {
      wrapper,
    });

    await logMeeting.result.current.mutateAsync({
      mentorId: "mentor-1",
      scheduledAt: "2026-08-15T10:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Completed,
    });

    await waitFor(() => {
      expect(getMentorshipMeetings).toHaveBeenCalledTimes(2);
    });
  });
});

describe("useUpdateMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refetches the timeline after updating a meeting", async () => {
    vi.mocked(getMentorshipMeetings).mockResolvedValue([]);
    vi.mocked(updateMeeting).mockResolvedValue(meeting());
    const queryClient = createTestQueryClient();
    const wrapper = wrapperFor(queryClient);

    const meetings = renderHook(() => useMentorshipMeetings("request-1"), {
      wrapper,
    });
    await waitFor(() => expect(meetings.result.current.isLoading).toBe(false));

    const update = renderHook(() => useUpdateMeeting("request-1"), {
      wrapper,
    });

    await update.result.current.mutateAsync({
      id: "meeting-1",
      payload: { notes: "Yeni not" },
    });

    expect(updateMeeting).toHaveBeenCalledWith("meeting-1", {
      notes: "Yeni not",
    });
    await waitFor(() => {
      expect(getMentorshipMeetings).toHaveBeenCalledTimes(2);
    });
  });
});

describe("useLogMeetingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when there is no mentor id", async () => {
    const { result } = renderHook(() => useLogMeetingForm("request-1", null), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleLogMeeting();
    });

    expect(logMentorshipMeeting).not.toHaveBeenCalled();
  });

  it("logs a meeting with the given mentor id and clears agenda/notes on success", async () => {
    vi.mocked(logMentorshipMeeting).mockResolvedValue(meeting());
    const { result } = renderHook(
      () => useLogMeetingForm("request-1", "mentor-1"),
      { wrapper: wrapperFor(createTestQueryClient()) },
    );

    act(() => {
      result.current.updateForm({ agenda: "Gündem", notes: "Not" });
    });

    await act(async () => {
      await result.current.handleLogMeeting();
    });

    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "request-1",
      expect.objectContaining({ mentorId: "mentor-1", agenda: "Gündem" }),
    );
    expect(result.current.form.agenda).toBe("");
    expect(result.current.form.notes).toBe("");
  });

  it("reports an error when logging fails", async () => {
    vi.mocked(logMentorshipMeeting).mockRejectedValue(
      new Error("Görüşme kaydedilemedi."),
    );
    const { result } = renderHook(
      () => useLogMeetingForm("request-1", "mentor-1"),
      { wrapper: wrapperFor(createTestQueryClient()) },
    );

    await act(async () => {
      await result.current.handleLogMeeting();
    });

    expect(result.current.logError).toBe("Görüşme kaydedilemedi.");
  });

  it("resets the form back to its defaults", () => {
    const { result } = renderHook(
      () => useLogMeetingForm("request-1", "mentor-1"),
      { wrapper: wrapperFor(createTestQueryClient()) },
    );

    act(() => {
      result.current.updateForm({ agenda: "Gündem" });
    });
    expect(result.current.form.agenda).toBe("Gündem");

    act(() => {
      result.current.resetForm();
    });
    expect(result.current.form.agenda).toBe("");
  });
});

describe("useMeetingNoteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes its fields from the given meeting", () => {
    const { result } = renderHook(
      () =>
        useMeetingNoteForm(
          "request-1",
          meeting({ notes: "Eski not", outcomes: "Eski sonuç" }),
        ),
      { wrapper: wrapperFor(createTestQueryClient()) },
    );

    expect(result.current.notes).toBe("Eski not");
    expect(result.current.outcomes).toBe("Eski sonuç");
    expect(result.current.status).toBe(MeetingStatus.Completed);
  });

  it("saves the edited fields for the given meeting and refetches the timeline", async () => {
    vi.mocked(getMentorshipMeetings).mockResolvedValue([]);
    vi.mocked(updateMeeting).mockResolvedValue(meeting());
    const queryClient = createTestQueryClient();
    const wrapper = wrapperFor(queryClient);

    const meetings = renderHook(() => useMentorshipMeetings("request-1"), {
      wrapper,
    });
    await waitFor(() => expect(meetings.result.current.isLoading).toBe(false));

    const { result } = renderHook(
      () => useMeetingNoteForm("request-1", meeting()),
      { wrapper },
    );

    act(() => {
      result.current.setNotes("Düzenlenmiş not");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMeeting).toHaveBeenCalledWith(
      "meeting-1",
      expect.objectContaining({ notes: "Düzenlenmiş not" }),
    );
    await waitFor(() => {
      expect(getMentorshipMeetings).toHaveBeenCalledTimes(2);
    });
  });
});
