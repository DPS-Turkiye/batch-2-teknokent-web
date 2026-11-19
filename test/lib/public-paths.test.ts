import { describe, expect, it } from "vitest";

import {
  attendancePath,
  isAttendancePath,
  isPublicPath,
  safeNextPath,
} from "@/lib/public-paths";

describe("safeNextPath", () => {
  it("keeps an in-app path", () => {
    expect(safeNextPath("/programs/42?tab=onaylar")).toBe(
      "/programs/42?tab=onaylar",
    );
  });

  // Each of these is read by browsers as another site.
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "evil.example",
  ])("drops %j", (next) => {
    expect(safeNextPath(next)).toBeNull();
  });

  it("drops nothing", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});

describe("isPublicPath", () => {
  // OTG's "Menton'a git" button and its redirect back reach these signed out.
  it("lets a signed-out visitor through OTG's start and callback paths", () => {
    expect(isPublicPath("/auth/otg/start")).toBe(true);
    expect(isPublicPath("/auth/otg/callback")).toBe(true);
    expect(isPublicPath("/auth/otg/other")).toBe(false);
  });
});

describe("attendance links", () => {
  it("puts a code's token under /attend and recognizes only that page", () => {
    expect(attendancePath("Ab_-9")).toBe("/attend/Ab_-9");
    expect(attendancePath("a/b")).toBe("/attend/a%2Fb");
    expect(isAttendancePath("/attend/Ab_-9")).toBe(true);
    expect(isAttendancePath("/attend")).toBe(false);
    expect(isAttendancePath("/attendance/x")).toBe(false);
    expect(isPublicPath("/attend/Ab_-9")).toBe(false);
  });
});
