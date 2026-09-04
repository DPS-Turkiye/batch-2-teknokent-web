import { afterEach, describe, expect, it } from "vitest";

import { dropDetachedFile, stripFileHandles } from "@/lib/draft-storage";

afterEach(() => {
  // Nothing to reset; stripFileHandles is pure.
});

describe("stripFileHandles", () => {
  it("round-trips a plain draft", () => {
    expect(stripFileHandles({ name: "Döngü", areas: ["Finans"] })).toEqual({
      name: "Döngü",
      areas: ["Finans"],
    });
  });

  it("drops File handles but keeps the surrounding metadata", () => {
    expect(
      stripFileHandles({
        cv: { name: "cv.pdf", size: 12, file: new File(["x"], "cv.pdf") },
      }),
    ).toEqual({ cv: { name: "cv.pdf", size: 12 } });
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
