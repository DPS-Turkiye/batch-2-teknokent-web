import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import { useMeetingNotePresence } from "@/hooks/use-meeting-note-presence";
import { bindMeetingNotePresence } from "@/lib/meeting-note-presence";

vi.mock("@/lib/meeting-note-presence", () => ({
  bindMeetingNotePresence: vi.fn(),
}));

const bridge = {
  applyRemoteUpdate: vi.fn(),
  destroy: vi.fn(),
};

describe("useMeetingNotePresence", () => {
  const unsubscribe = vi.fn();
  const subscribe = vi.fn((_listener: (update: string) => void) => unsubscribe);
  const publish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindMeetingNotePresence).mockReturnValue(bridge);
  });

  it("keeps one awareness for the document across renders", () => {
    const doc = new Y.Doc();
    const { result, rerender } = renderHook(() =>
      useMeetingNotePresence(doc, false, subscribe, publish),
    );
    const first = result.current;

    rerender();

    expect(first).toBeInstanceOf(Awareness);
    expect(result.current).toBe(first);
    expect(first.doc).toBe(doc);
  });

  it("shares no presence while the room is offline", () => {
    renderHook(() =>
      useMeetingNotePresence(new Y.Doc(), false, subscribe, publish),
    );

    expect(bindMeetingNotePresence).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("binds presence once connected and feeds remote updates into it", () => {
    const { result } = renderHook(() =>
      useMeetingNotePresence(new Y.Doc(), true, subscribe, publish),
    );

    expect(bindMeetingNotePresence).toHaveBeenCalledWith(
      result.current,
      publish,
    );
    expect(subscribe).toHaveBeenCalledWith(bridge.applyRemoteUpdate);
  });

  it("unbinds when the room disconnects", () => {
    const { rerender } = renderHook(
      ({ connected }) =>
        useMeetingNotePresence(new Y.Doc(), connected, subscribe, publish),
      { initialProps: { connected: true } },
    );

    rerender({ connected: false });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(bridge.destroy).toHaveBeenCalledTimes(1);
  });

  it("unbinds and destroys the awareness on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useMeetingNotePresence(new Y.Doc(), true, subscribe, publish),
    );
    const destroy = vi.spyOn(result.current, "destroy");

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(bridge.destroy).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
