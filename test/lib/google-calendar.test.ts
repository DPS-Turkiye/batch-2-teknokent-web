import { describe, expect, it } from "vitest";

import { parseGoogleMeetLink } from "@/lib/google-calendar";

describe("parseGoogleMeetLink", () => {
  it("accepts a meet.google.com URL and rejects other hosts", () => {
    expect(parseGoogleMeetLink("https://meet.google.com/aaa-bbbb-ccc")).toBe(
      "https://meet.google.com/aaa-bbbb-ccc",
    );
    expect(parseGoogleMeetLink("https://example.com/not-meet")).toBeNull();
    expect(parseGoogleMeetLink("")).toBeNull();
  });
});
