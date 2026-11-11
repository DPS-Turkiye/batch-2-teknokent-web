import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assistantShareQueryKey,
  meetingNoteQueryKey,
  meetingTodosQueryKey,
  useAssistantShare,
  useCreateMeetingTodo,
  useDeleteMeetingTodo,
  useMeetingNote,
  useMeetingTodoEditor,
  useMeetingTodos,
  usePublishAssistantShare,
  useSaveMeetingNote,
} from "@/hooks/use-meeting-notes";
import {
  AssistantShareKind,
  type MeetingAssistantShare,
  type MeetingNote,
  type MeetingTodo,
} from "@/interfaces/meeting-note";
import {
  getAssistantShare,
  getMeetingNote,
  getMeetingTodos,
  patchMeetingTodo,
  postAssistantShare,
  postMeetingTodo,
  putMeetingNote,
  removeMeetingTodo,
} from "@/lib/client/meeting-notes";
import type { MeetingReport, TranscriptLine } from "@/types/assistant";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/meeting-notes", () => ({
  getAssistantShare: vi.fn(),
  getMeetingNote: vi.fn(),
  getMeetingTodos: vi.fn(),
  patchMeetingTodo: vi.fn(),
  postAssistantShare: vi.fn(),
  postMeetingTodo: vi.fn(),
  putMeetingNote: vi.fn(),
  removeMeetingTodo: vi.fn(),
}));

function todo(id: string, title: string): MeetingTodo {
  return { id, meetingId: "m-1", title, done: false, displayOrder: 0 };
}

const note: MeetingNote = {
  meetingId: "m-1",
  content: "Notlar",
  version: 2,
};
const line: TranscriptLine = {
  id: "s1",
  speaker: "Ayşe",
  text: "Merhaba",
  at: "00:10",
};
const report: MeetingReport = {
  title: "Rapor",
  meetingDate: null,
  topic: null,
  summary: "Özet",
  topicsDiscussed: [],
  decisions: [],
  actionItems: [],
  risksOrBlockers: [],
  nextSteps: [],
  model: "test-model",
};

function share(
  overrides: Partial<MeetingAssistantShare> = {},
): MeetingAssistantShare {
  return {
    meetingId: "m-1",
    transcript: null,
    transcriptPublishedAt: null,
    report: null,
    reportPublishedAt: null,
    ...overrides,
  };
}

describe("meeting notes hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for no note or to-dos without a meeting", () => {
    const wrapped = queryWrapper();
    renderHook(() => useMeetingNote(""), wrapped);
    renderHook(() => useMeetingTodos(""), wrapped);
    renderHook(() => useAssistantShare(""), wrapped);

    expect(getMeetingNote).not.toHaveBeenCalled();
    expect(getMeetingTodos).not.toHaveBeenCalled();
    expect(getAssistantShare).not.toHaveBeenCalled();
  });

  it("puts the saved note straight into the note cache", async () => {
    vi.mocked(putMeetingNote).mockResolvedValue(note);
    const { queryClient, wrapper } = queryWrapper();
    const { result } = renderHook(() => useSaveMeetingNote("m-1"), {
      wrapper,
    });

    await act(() => result.current.mutateAsync({ content: "Notlar" }));

    expect(putMeetingNote).toHaveBeenCalledWith("m-1", { content: "Notlar" });
    expect(queryClient.getQueryData(meetingNoteQueryKey("m-1"))).toEqual(note);
  });

  it("replaces the to-do cache with the list the server sends back", async () => {
    const created = [todo("t-1", "Sunum")];
    vi.mocked(postMeetingTodo).mockResolvedValue(created);
    vi.mocked(removeMeetingTodo).mockResolvedValue([]);
    const { queryClient, wrapper } = queryWrapper();
    const create = renderHook(() => useCreateMeetingTodo("m-1"), { wrapper });
    const remove = renderHook(() => useDeleteMeetingTodo("m-1"), { wrapper });

    await act(() => create.result.current.mutateAsync("Sunum"));
    expect(postMeetingTodo).toHaveBeenCalledWith("m-1", "Sunum");
    expect(queryClient.getQueryData(meetingTodosQueryKey("m-1"))).toEqual(
      created,
    );

    await act(() => remove.result.current.mutateAsync("t-1"));
    expect(removeMeetingTodo).toHaveBeenCalledWith("m-1", "t-1");
    expect(queryClient.getQueryData(meetingTodosQueryKey("m-1"))).toEqual([]);
  });

  describe("useMeetingTodoEditor", () => {
    beforeEach(() => {
      vi.mocked(patchMeetingTodo).mockResolvedValue([todo("t-1", "Yeni")]);
    });

    it("starts editing a to-do with its current text", () => {
      const { result } = renderHook(
        () => useMeetingTodoEditor("m-1"),
        queryWrapper(),
      );

      act(() => result.current.start(todo("t-1", "Sunum")));

      expect(result.current.editingId).toBe("t-1");
      expect(result.current.draft).toBe("Sunum");
    });

    it("saves a changed, trimmed title and stops editing", async () => {
      const { result } = renderHook(
        () => useMeetingTodoEditor("m-1"),
        queryWrapper(),
      );
      act(() => result.current.start(todo("t-1", "Sunum")));
      act(() => result.current.setDraft("  Yeni  "));

      act(() => result.current.save());

      expect(result.current.editingId).toBeNull();
      expect(result.current.draft).toBe("");
      await waitFor(() =>
        expect(patchMeetingTodo).toHaveBeenCalledWith("m-1", "t-1", {
          title: "Yeni",
          done: undefined,
        }),
      );
    });

    it.each([
      ["an unchanged", "Sunum"],
      ["a blank", "   "],
    ])("keeps the to-do as it was for %s title", (_case, typed) => {
      const { result } = renderHook(
        () => useMeetingTodoEditor("m-1"),
        queryWrapper(),
      );
      act(() => result.current.start(todo("t-1", "Sunum")));
      act(() => result.current.setDraft(typed));

      act(() => result.current.save());

      expect(result.current.editingId).toBeNull();
      expect(patchMeetingTodo).not.toHaveBeenCalled();
    });

    it("drops the draft on cancel", () => {
      const { result } = renderHook(
        () => useMeetingTodoEditor("m-1"),
        queryWrapper(),
      );
      act(() => result.current.start(todo("t-1", "Sunum")));
      act(() => result.current.setDraft("Yarım"));

      act(() => result.current.cancel());

      expect(result.current.editingId).toBeNull();
      expect(result.current.draft).toBe("");
      expect(patchMeetingTodo).not.toHaveBeenCalled();
    });
  });

  describe("useAssistantShare", () => {
    it("keeps asking every 8 seconds while the transcript or report is missing", async () => {
      vi.useFakeTimers();
      vi.mocked(getAssistantShare)
        .mockResolvedValueOnce(share())
        .mockResolvedValueOnce(share({ transcript: [line] }))
        .mockResolvedValue(share({ transcript: [line], report }));
      const { result } = renderHook(
        () => useAssistantShare("m-1", { refetchWhileIncomplete: true }),
        queryWrapper(),
      );

      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(getAssistantShare).toHaveBeenCalledTimes(1);

      await act(() => vi.advanceTimersByTimeAsync(8_000));
      expect(getAssistantShare).toHaveBeenCalledTimes(2);

      await act(() => vi.advanceTimersByTimeAsync(8_000));
      expect(getAssistantShare).toHaveBeenCalledTimes(3);
      // TanStack Query hands results to React on a zero-delay timer.
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(result.current.data?.report).toEqual(report);

      await act(() => vi.advanceTimersByTimeAsync(24_000));
      expect(getAssistantShare).toHaveBeenCalledTimes(3);
    });

    it("asks once when not told to wait for the share to complete", async () => {
      vi.useFakeTimers();
      vi.mocked(getAssistantShare).mockResolvedValue(share());
      renderHook(() => useAssistantShare("m-1"), queryWrapper());

      await act(() => vi.advanceTimersByTimeAsync(30_000));

      expect(getAssistantShare).toHaveBeenCalledTimes(1);
    });
  });

  it("puts a published share into the cache of the meeting it belongs to", async () => {
    const published = share({ meetingId: "m-2", report });
    vi.mocked(postAssistantShare).mockResolvedValue(published);
    const { queryClient, wrapper } = queryWrapper();
    const { result } = renderHook(() => usePublishAssistantShare(), {
      wrapper,
    });

    await act(() =>
      result.current.mutateAsync({
        meetingId: "m-2",
        payload: { kind: AssistantShareKind.Report, report },
      }),
    );

    expect(postAssistantShare).toHaveBeenCalledWith("m-2", {
      kind: "REPORT",
      report,
    });
    expect(queryClient.getQueryData(assistantShareQueryKey("m-2"))).toEqual(
      published,
    );
  });
});
