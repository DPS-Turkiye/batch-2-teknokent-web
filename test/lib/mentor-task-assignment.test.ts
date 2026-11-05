import { describe, expect, it } from "vitest";
import { assignMentorshipTaskSchema } from "@/lib/mentor-task-assignment";

const ownerId = "00000000-0000-4000-8000-000000000001";

describe("task assignment input", () => {
  it("normalizes text and strips caller-controlled scope", () => {
    expect(
      assignMentorshipTaskSchema.parse({
        ownerId,
        title: "  Interview users  ",
        description: " Notes ",
        actorId: "other",
        organizationId: "other",
      }),
    ).toEqual({ ownerId, title: "Interview users", description: "Notes" });
  });
  it.each([
    { ownerId, title: " " },
    { ownerId: "", title: "Task" },
    { ownerId, title: "x".repeat(256) },
    { ownerId, title: "Task", description: "x".repeat(10001) },
    { ownerId, title: "Task", dueDate: "2026-02-30" },
  ])("refuses invalid input: %o", (input) => {
    expect(assignMentorshipTaskSchema.safeParse(input).success).toBe(false);
  });
  it("allows a date without timezone conversion", () => {
    expect(
      assignMentorshipTaskSchema.parse({
        ownerId,
        title: "Task",
        dueDate: "2026-12-01",
      }).dueDate,
    ).toBe("2026-12-01");
  });
});
