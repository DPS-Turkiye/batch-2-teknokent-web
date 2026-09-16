import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DocumentStatus,
  useMeetingNoteDocument,
} from "@/hooks/use-meeting-note-document";
import { getMeetingNoteDocument } from "@/lib/client/meeting-notes";

vi.mock("@/lib/client/meeting-notes", () => ({
  getMeetingNoteDocument: vi.fn(),
}));

describe("useMeetingNoteDocument", () => {
  beforeEach(() => {
    vi.mocked(getMeetingNoteDocument).mockReset();
  });

  it("waits for the live socket before opening the notebook", () => {
    vi.mocked(getMeetingNoteDocument).mockResolvedValue({
      state: null,
      seedFromSnapshot: true,
    });
    const subscribe = vi.fn(() => vi.fn());

    const { result } = renderHook(() =>
      useMeetingNoteDocument("meeting-1", false, subscribe, vi.fn()),
    );

    expect(result.current.status).toBe(DocumentStatus.Loading);
    expect(getMeetingNoteDocument).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("loads the Yjs document once the socket is connected", async () => {
    vi.mocked(getMeetingNoteDocument).mockResolvedValue({
      state: null,
      seedFromSnapshot: false,
    });
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);

    const { result } = renderHook(() =>
      useMeetingNoteDocument("meeting-1", true, subscribe, vi.fn()),
    );

    await waitFor(() =>
      expect(result.current.status).toBe(DocumentStatus.Ready),
    );
    expect(getMeetingNoteDocument).toHaveBeenCalledWith("meeting-1");
    expect(subscribe).toHaveBeenCalled();
  });
});
