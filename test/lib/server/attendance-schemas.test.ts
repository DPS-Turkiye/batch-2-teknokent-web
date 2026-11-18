import { describe, expect, it } from "vitest";

import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import {
  readAttendanceParticipant,
  readAttendanceSession,
  sessionCheckInSchema,
} from "@/lib/server/attendance-schemas";

const USER = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("sessionCheckInSchema", () => {
  it.each(["a", "Ab_-9", "A".repeat(43), "A".repeat(64)])(
    "takes the token %j",
    (token) => {
      expect(sessionCheckInSchema.safeParse({ token }).success).toBe(true);
    },
  );

  it.each(["", "A".repeat(65), "Ab+/", "Ab==", "../x", "a b"])(
    "refuses the token %j",
    (token) => {
      expect(sessionCheckInSchema.safeParse({ token }).success).toBe(false);
    },
  );
});

describe("readAttendanceSession", () => {
  it.each([
    ["1", 1],
    ["520", 520],
  ])("reads week %j", async (week, number) => {
    await expect(
      readAttendanceSession({ week, kind: "WORKSHOP" }),
    ).resolves.toEqual({
      ok: true,
      data: { week: number, kind: AttendanceSessionKind.Workshop },
    });
  });

  it.each([
    ["0", "LESSON"],
    ["521", "LESSON"],
    ["01", "LESSON"],
    ["1e2", "LESSON"],
    ["0x10", "LESSON"],
    [" 5", "LESSON"],
    ["+3", "LESSON"],
    ["2", "lesson"],
    ["2", "BOTH"],
  ])("refuses week %j and kind %j with a 400", async (week, kind) => {
    const read = await readAttendanceSession({ week, kind });

    expect(read.ok ? null : read.response.status).toBe(400);
  });
});

describe("readAttendanceParticipant", () => {
  it("reads the session and the person", async () => {
    await expect(
      readAttendanceParticipant({ week: "3", kind: "WEEK", userId: USER }),
    ).resolves.toEqual({
      ok: true,
      data: { week: 3, kind: AttendanceSessionKind.Week, userId: USER },
    });
  });

  it("refuses a person who is not an id", async () => {
    const read = await readAttendanceParticipant({
      week: "3",
      kind: "LESSON",
      userId: "user-1",
    });

    expect(read.ok).toBe(false);
  });
});
