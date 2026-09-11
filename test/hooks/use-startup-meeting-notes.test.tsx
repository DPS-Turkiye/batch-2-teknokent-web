import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import {
  useCreateMeetingTodo,
  useMeetingNote,
  useMeetingTodos,
  useUpdateMeetingTodo,
} from "@/hooks/use-meeting-notes";
import {
  useOpenTodoCounts,
  useStartupMeetingNotes,
} from "@/hooks/use-startup-meeting-notes";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import { getMeetingTodos } from "@/lib/client/meeting-notes";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-meeting-notes", () => ({
  meetingTodosQueryKey: (meetingId: string) => ["meeting-todos", meetingId],
  useCreateMeetingTodo: vi.fn(),
  useMeetingNote: vi.fn(),
  useMeetingTodos: vi.fn(),
  useUpdateMeetingTodo: vi.fn(),
}));

vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/lib/client/meeting-notes", () => ({ getMeetingTodos: vi.fn() }));

const createTodo = vi.fn();
const updateTodo = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe("useStartupMeetingNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMeetingNote).mockReturnValue({
      data: { meetingId: "m-1", content: "<p>Not</p>", version: 1 },
      isLoading: false,
    } as never);
    vi.mocked(useMeetingTodos).mockReturnValue({
      data: [
        {
          id: "t-1",
          meetingId: "m-1",
          title: "Öncelikler",
          done: false,
          displayOrder: 0,
        },
      ],
    } as never);
    createTodo.mockImplementation(
      (_title: string, options?: { onSuccess?: () => void }) =>
        options?.onSuccess?.(),
    );
    vi.mocked(useCreateMeetingTodo).mockReturnValue({
      mutate: createTodo,
      isPending: false,
    } as never);
    vi.mocked(useUpdateMeetingTodo).mockReturnValue({
      mutate: updateTodo,
    } as never);
  });

  it("adds a trimmed to-do and clears the field", () => {
    const { result } = renderHook(() => useStartupMeetingNotes("m-1"), {
      wrapper,
    });

    act(() => result.current.setTodoDraft("  Kullanıcı testi  "));
    act(() => result.current.addTodo());

    expect(createTodo.mock.calls[0][0]).toBe("Kullanıcı testi");
    expect(result.current.todoDraft).toBe("");
  });

  it("ignores an empty to-do and ticks one off", () => {
    const { result } = renderHook(() => useStartupMeetingNotes("m-1"), {
      wrapper,
    });

    act(() => result.current.addTodo());
    act(() => result.current.toggleTodo("t-1", true));

    expect(createTodo).not.toHaveBeenCalled();
    expect(updateTodo).toHaveBeenCalledWith({ todoId: "t-1", done: true });
    expect(result.current.noteContent).toBe("<p>Not</p>");
  });

  it("attaches photos and files to the open meeting", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "doc-1",
      kind: DocumentKind.NotePhoto,
      originalFilename: "whiteboard.png",
      sizeBytes: 3,
    });
    const photo = new File(["png"], "whiteboard.png", { type: "image/png" });
    const deck = new File(["%PDF"], "deck.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => useStartupMeetingNotes("m-1"), {
      wrapper,
    });

    act(() => result.current.uploadPhoto(photo));
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    act(() => result.current.uploadFile(deck));
    await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(2));

    expect(uploadDocument).toHaveBeenNthCalledWith(
      1,
      photo,
      DocumentKind.NotePhoto,
      undefined,
      "m-1",
    );
    expect(uploadDocument).toHaveBeenNthCalledWith(
      2,
      deck,
      DocumentKind.MeetingFile,
      undefined,
      "m-1",
    );
  });
});

describe("useOpenTodoCounts", () => {
  it("counts the to-dos still open on each meeting", async () => {
    vi.mocked(getMeetingTodos).mockImplementation(async (meetingId) =>
      meetingId === "m-2"
        ? [
            { id: "a", meetingId, title: "A", done: false, displayOrder: 0 },
            { id: "b", meetingId, title: "B", done: true, displayOrder: 1 },
          ]
        : [],
    );
    const ids = ["m-2", "m-3"];

    const { result } = renderHook(() => useOpenTodoCounts(ids), { wrapper });

    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.get("m-2")).toBe(1);
    expect(result.current.get("m-3")).toBe(0);
  });
});
