import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearDraft,
  dropDetachedFile,
  loadDraft,
  saveDraft,
} from "@/lib/draft-storage";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("draft storage", () => {
  it("round-trips a plain draft", () => {
    saveDraft("k", { name: "Döngü", areas: ["Finans"] });
    expect(loadDraft("k")).toEqual({ name: "Döngü", areas: ["Finans"] });
  });

  it("drops File handles but keeps the surrounding metadata", () => {
    saveDraft("k", {
      cv: { name: "cv.pdf", size: 12, file: new File(["x"], "cv.pdf") },
    });
    expect(loadDraft("k")).toEqual({ cv: { name: "cv.pdf", size: 12 } });
  });

  it("returns null for a missing or unreadable draft", () => {
    expect(loadDraft("absent")).toBeNull();
    sessionStorage.setItem("metual.draft.broken", "{not json");
    expect(loadDraft("broken")).toBeNull();
  });

  it("clears a stored draft", () => {
    saveDraft("k", { a: 1 });
    clearDraft("k");
    expect(loadDraft("k")).toBeNull();
  });

  it("never throws when storage itself is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveDraft("k", { a: 1 })).not.toThrow();
    expect(loadDraft("k")).toBeNull();
  });
});

describe("dropDetachedFile", () => {
  it("drops an attachment that lost its File and counts it", () => {
    expect(dropDetachedFile({ name: "cv.pdf", size: 1 })).toEqual({
      value: null,
      dropped: 1,
    });
  });

  it("keeps an attachment that still has its File", () => {
    const value = { name: "cv.pdf", size: 1, file: new File(["x"], "cv.pdf") };
    expect(dropDetachedFile(value)).toEqual({ value, dropped: 0 });
  });

  it("treats an absent attachment as nothing lost", () => {
    expect(dropDetachedFile(null)).toEqual({ value: null, dropped: 0 });
  });
});
