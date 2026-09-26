import { describe, expect, it } from "vitest";

import { sharedFileMessage, sharedFileName } from "@/lib/mentorship-messages";

describe("shared file messages", () => {
  it("round-trips a file name through the message body", () => {
    expect(sharedFileName(sharedFileMessage("pitch-deck.pdf"))).toBe(
      "pitch-deck.pdf",
    );
  });

  it("returns null for an ordinary message", () => {
    expect(sharedFileName("Yarın görüşelim mi?")).toBeNull();
  });
});
