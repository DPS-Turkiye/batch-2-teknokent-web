import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { MobileTaskSource, MobileTaskTone } from "@/interfaces/mobile";
import type { ProcessAssignment } from "@/interfaces/startup-process";
import {
  collectTasks,
  completedTasks,
  dueLabel,
  groupOpenTasks,
} from "@/lib/mobile-tasks";
import {
  menteeActionItemFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

// Wednesday 23 September 2026.
const TODAY = new Date(2026, 8, 23, 12, 0);

const REQUEST = menteeRequestFixture({
  id: "r1",
  status: MentorshipRequestStatus.Accepted,
  mentorName: "Nihan Öztürk",
  supportArea: "Ürün stratejisi",
});

function assignment(overrides: Partial<ProcessAssignment> = {}) {
  return {
    id: "p1",
    roundId: null,
    stage: "MVP",
    title: "Finansal model",
    description: null,
    status: ActionItemStatus.Open,
    dueDate: "2026-10-10",
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: "Burcu Şen",
    createdByRole: null,
    createdAt: "2026-09-01T10:00:00Z",
    ...overrides,
  } as ProcessAssignment;
}

const TASKS = collectTasks(
  {
    actionItemsByRequest: [
      {
        request: REQUEST,
        items: [
          menteeActionItemFixture({
            id: "late",
            title: "Notları özetle",
            dueDate: "2026-09-22",
          }),
          menteeActionItemFixture({
            id: "now",
            title: "Pitch deck",
            dueDate: "2026-09-23",
          }),
          menteeActionItemFixture({
            id: "week",
            title: "Rakip analizi",
            dueDate: "2026-09-25",
          }),
          menteeActionItemFixture({
            id: "done",
            title: "Eski görev",
            status: ActionItemStatus.Completed,
          }),
          menteeActionItemFixture({
            id: "gone",
            title: "İptal",
            status: ActionItemStatus.Cancelled,
          }),
          menteeActionItemFixture({ id: "p1", title: "Aynı süreç görevi" }),
        ],
      },
    ],
    assignments: [assignment()],
    deadlines: [
      {
        id: "e1",
        programId: "prog",
        programName: "METU Stars 2026",
        title: "Ara rapor teslimi",
        kind: ProgramEventKind.Deadline,
        startsAt: new Date(2026, 8, 25, 23, 59).toISOString(),
        endsAt: null,
        description: null,
      },
      {
        id: "e2",
        programId: "prog",
        programName: "METU Stars 2026",
        title: "Atölye",
        kind: ProgramEventKind.Event,
        startsAt: new Date(2026, 8, 24, 10, 0).toISOString(),
        endsAt: null,
        description: null,
      },
    ],
  },
  TODAY,
);

describe("dueLabel", () => {
  it("names nearby days and dates the rest", () => {
    expect(dueLabel(new Date(2026, 8, 22), TODAY)).toBe("Dün");
    expect(dueLabel(new Date(2026, 8, 23), TODAY)).toBe("Bugün");
    expect(dueLabel(new Date(2026, 8, 24), TODAY)).toBe("Yarın");
    expect(dueLabel(new Date(2026, 8, 25), TODAY)).toBe("25 Eylül");
    expect(dueLabel(null, TODAY)).toBe("Tarih yok");
  });
});

describe("collectTasks", () => {
  it("keeps open and done tasks, drops cancelled ones, events and process duplicates", () => {
    expect(TASKS.map((task) => task.title)).toEqual([
      "Notları özetle",
      "Pitch deck",
      "Rakip analizi",
      "Eski görev",
      "Finansal model",
      "Ara rapor teslimi",
    ]);
  });

  it("describes a mentorship task by its mentor and links the chat", () => {
    const late = TASKS[0]!;

    expect(late).toMatchObject({
      source: MobileTaskSource.Mentorship,
      meta: "Dün · Nihan Öztürk",
      tone: MobileTaskTone.Overdue,
      chips: ["Ürün stratejisi mentorluğu"],
      chatHref: "/m/messages/mentorship/r1",
    });
  });

  it("sends a process task to the web to be handed in", () => {
    const process = TASKS.find(
      (task) => task.source === MobileTaskSource.Process,
    );

    expect(process?.webHref).toBe("/startup/process?web=1");
    expect(process?.chatHref).toBeNull();
  });
});

describe("groupOpenTasks and completedTasks", () => {
  it("groups by urgency and keeps program deadlines apart", () => {
    const groups = groupOpenTasks(TASKS, TODAY);

    expect(
      groups.map((group) => [
        group.label,
        group.tasks.map((task) => task.title),
      ]),
    ).toEqual([
      ["Gecikmiş", ["Notları özetle"]],
      ["Bugün", ["Pitch deck"]],
      ["Bu hafta", ["Rakip analizi"]],
      ["Daha sonra", ["Finansal model"]],
      ["Program", ["Ara rapor teslimi"]],
    ]);
    expect(groups[0]?.urgent).toBe(true);
  });

  it("lists the completed ones separately", () => {
    expect(completedTasks(TASKS).map((task) => task.title)).toEqual([
      "Eski görev",
    ]);
  });
});
