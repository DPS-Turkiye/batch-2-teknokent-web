import { describe, expect, it } from "vitest";

import { reachedWatchedShare, youtubeWatchUrl } from "@/lib/youtube";

describe("youtube", () => {
  // D2b: the end, or 90 % of the length.
  it("counts a video as watched from 90 % of its length", () => {
    expect(reachedWatchedShare(89, 100)).toBe(false);
    expect(reachedWatchedShare(90, 100)).toBe(true);
    expect(reachedWatchedShare(0, 0)).toBe(false);
  });

  it("writes the short watch link the editor shows", () => {
    expect(youtubeWatchUrl("M7lc1UVf-VE")).toBe("https://youtu.be/M7lc1UVf-VE");
  });
});
