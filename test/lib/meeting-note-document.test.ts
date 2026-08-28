import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import {
  bindMeetingNoteContributors,
  bindMeetingNoteDocument,
  formatMeetingNoteContributors,
} from "@/lib/meeting-note-document";

function encodedState(doc: Y.Doc) {
  return bytesToBase64(Y.encodeStateAsUpdate(doc));
}

describe("meeting note document bridge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("relays local edits so another document can merge them", () => {
    const publish = vi.fn();
    const doc = new Y.Doc();
    bindMeetingNoteDocument(doc, publish);

    doc.getText("note").insert(0, "Sprint");

    const [update, fullState] = publish.mock.calls[0];
    expect(fullState).toBe(false);

    const mirror = new Y.Doc();
    Y.applyUpdate(mirror, base64ToBytes(update));
    expect(mirror.getText("note").toString()).toBe("Sprint");
  });

  it("applies remote updates without relaying them back", () => {
    const publish = vi.fn();
    const doc = new Y.Doc();
    const bridge = bindMeetingNoteDocument(doc, publish);

    const other = new Y.Doc();
    other.getText("note").insert(0, "Ortak not");
    bridge.applyRemoteUpdate(encodedState(other));

    expect(doc.getText("note").toString()).toBe("Ortak not");
    expect(publish).not.toHaveBeenCalledWith(expect.any(String), false);
  });

  it("stores the full state once edits settle", () => {
    const publish = vi.fn();
    const doc = new Y.Doc();
    bindMeetingNoteDocument(doc, publish);

    doc.getText("note").insert(0, "Sprint");
    publish.mockClear();
    vi.advanceTimersByTime(3000);

    const [update, fullState] = publish.mock.calls[0];
    expect(fullState).toBe(true);

    const mirror = new Y.Doc();
    Y.applyUpdate(mirror, base64ToBytes(update));
    expect(mirror.getText("note").toString()).toBe("Sprint");
  });

  it("keeps Redis fresh after a remote edit as well", () => {
    const publish = vi.fn();
    const doc = new Y.Doc();
    const bridge = bindMeetingNoteDocument(doc, publish);

    const other = new Y.Doc();
    other.getText("note").insert(0, "Ortak not");
    bridge.applyRemoteUpdate(encodedState(other));
    vi.advanceTimersByTime(3000);

    expect(publish).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("stops publishing after the room is left", () => {
    const publish = vi.fn();
    const doc = new Y.Doc();
    const bridge = bindMeetingNoteDocument(doc, publish);

    bridge.destroy();
    doc.getText("note").insert(0, "Sprint");
    vi.advanceTimersByTime(3000);

    expect(publish).not.toHaveBeenCalled();
  });

  it("lists people who typed, not people who only opened the note", () => {
    const doc = new Y.Doc();
    bindMeetingNoteContributors(doc, { userId: "1", name: "Sude" });

    expect(formatMeetingNoteContributors(doc)).toBe("");

    doc.getText("note").insert(0, "Sprint");

    expect(formatMeetingNoteContributors(doc)).toBe("Sude");
  });

  it("keeps a remote writer's name without crediting the reader", () => {
    const doc = new Y.Doc();
    bindMeetingNoteContributors(doc, { userId: "1", name: "Sude" });

    const other = new Y.Doc();
    bindMeetingNoteContributors(other, {
      userId: "2",
      name: "Kemal Arslan",
    });
    other.getText("note").insert(0, "Ortak not");
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(other), "remote");

    expect(formatMeetingNoteContributors(doc)).toBe("Kemal Arslan");
  });

  it("joins several writers with commas once each", () => {
    const doc = new Y.Doc();
    bindMeetingNoteContributors(doc, { userId: "1", name: "Sude" });
    doc.getText("note").insert(0, "Sprint");

    const other = new Y.Doc();
    bindMeetingNoteContributors(other, {
      userId: "2",
      name: "Kemal Arslan",
    });
    Y.applyUpdate(other, Y.encodeStateAsUpdate(doc));
    other.getText("note").insert(6, " notu");

    Y.applyUpdate(doc, Y.encodeStateAsUpdate(other), "remote");

    expect(formatMeetingNoteContributors(doc)).toBe("Sude, Kemal Arslan");
  });
});
