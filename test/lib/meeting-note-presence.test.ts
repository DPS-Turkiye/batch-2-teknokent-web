import { describe, expect, it, vi } from "vitest";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import {
  bindMeetingNotePresence,
  pickPresenceColor,
} from "@/lib/meeting-note-presence";

function awarenessOf() {
  return new Awareness(new Y.Doc());
}

describe("meeting note presence bridge", () => {
  it("relays the local cursor so other clients can show it", () => {
    const publish = vi.fn();
    const awareness = awarenessOf();
    bindMeetingNotePresence(awareness, publish);

    awareness.setLocalStateField("user", { name: "Sude", color: "#4f39f6" });

    const mirror = awarenessOf();
    bindMeetingNotePresence(mirror, vi.fn()).applyRemoteUpdate(
      publish.mock.calls.at(-1)![0],
    );

    expect(mirror.getStates().get(awareness.clientID)?.user).toEqual({
      name: "Sude",
      color: "#4f39f6",
    });
  });

  it("does not relay remote cursors back to the room", () => {
    const publish = vi.fn();
    const awareness = awarenessOf();
    const bridge = bindMeetingNotePresence(awareness, publish);
    awareness.setLocalStateField("user", { name: "Sude", color: "#4f39f6" });

    const other = awarenessOf();
    const otherPublish = vi.fn();
    bindMeetingNotePresence(other, otherPublish);
    other.setLocalStateField("user", { name: "Kemal", color: "#0d9488" });
    publish.mockClear();

    bridge.applyRemoteUpdate(otherPublish.mock.calls.at(-1)![0]);

    expect(awareness.getStates().has(other.clientID)).toBe(true);
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("clears the local cursor for everyone when the room is left", () => {
    const publish = vi.fn();
    const awareness = awarenessOf();
    const bridge = bindMeetingNotePresence(awareness, publish);
    awareness.setLocalStateField("user", { name: "Sude", color: "#4f39f6" });

    const mirror = awarenessOf();
    const mirrorBridge = bindMeetingNotePresence(mirror, vi.fn());
    mirrorBridge.applyRemoteUpdate(publish.mock.calls.at(-1)![0]);

    bridge.destroy();
    mirrorBridge.applyRemoteUpdate(publish.mock.calls.at(-1)![0]);

    expect(mirror.getStates().has(awareness.clientID)).toBe(false);
  });

  it("stops publishing after the room is left", () => {
    const publish = vi.fn();
    const awareness = awarenessOf();
    const bridge = bindMeetingNotePresence(awareness, publish);

    bridge.destroy();
    publish.mockClear();
    awareness.setLocalStateField("user", { name: "Sude", color: "#4f39f6" });

    expect(publish).not.toHaveBeenCalled();
  });

  it("keeps the last remote caret when the editor loses focus", () => {
    const publish = vi.fn();
    const awareness = awarenessOf();
    bindMeetingNotePresence(awareness, publish);
    awareness.setLocalStateField("user", { name: "Sude", color: "#4f39f6" });
    awareness.setLocalStateField("cursor", {
      anchor: { type: null, tname: "default", item: null, assoc: 0 },
      head: { type: null, tname: "default", item: null, assoc: 0 },
    });
    publish.mockClear();

    awareness.setLocalStateField("cursor", null);

    expect(publish).not.toHaveBeenCalled();
  });

  it("gives the same user the same colour on every device", () => {
    const color = pickPresenceColor("user-1");

    expect(pickPresenceColor("user-1")).toBe(color);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
