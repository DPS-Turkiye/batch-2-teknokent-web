import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as alignDates } from "@/app/api/coordinator/programs/[id]/weeks/align-dates/route";
import { GET, PUT } from "@/app/api/coordinator/programs/[id]/weeks/route";
import type { ProgramWeekPlan } from "@/interfaces/program-week";
import { UserRole } from "@/interfaces/session";
import {
  alignProgramDates,
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import { HttpMethod } from "@/lib/http-method";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { weekPlan } from "@test/fixtures/program-week";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-weeks", () => ({
  alignProgramDates: vi.fn(),
  fetchProgramWeekPlan: vi.fn(),
  replaceProgramWeekPlan: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "program-1" }) };
const ok = backendResponse<ProgramWeekPlan>(weekPlan({ totalWeeks: 12 }));
/** A valid week, for the cases that break one field of it. */
const week = {
  week: 2,
  title: "Görüşmeler",
  topics: [],
  activities: [],
  deliverables: [],
  inferred: false,
  startDate: null,
  endDate: null,
  sessions: [],
};

function put(body: unknown) {
  return new NextRequest(
    new URL("/api/coordinator/programs/program-1/weeks", "http://localhost"),
    {
      method: HttpMethod.Put,
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({
      userId: "coordinator-1",
      role: UserRole.Coordinator,
    }),
  });
  vi.mocked(fetchProgramWeekPlan).mockResolvedValue(ok);
  vi.mocked(replaceProgramWeekPlan).mockResolvedValue(ok);
});

describe("coordinator weekly plan proxy", () => {
  it("forwards complete dated special-day edits with identity from the session", async () => {
    const day = {
      date: "2026-12-15",
      startTime: "15:00",
      endTime: null,
      place: "KKM",
      title: "Demo Günü",
      details: ["Sunum"],
    };
    expect(
      (
        await PUT(
          put({ actorId: "forged", weeks: [], specialDays: [day] }),
          context,
        )
      ).status,
    ).toBe(200);
    expect(replaceProgramWeekPlan).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [],
      [day],
    );
  });

  it("aligns using the session actor and stops when the guard refuses", async () => {
    vi.mocked(alignProgramDates).mockResolvedValue(ok);
    expect(
      (
        await alignDates(
          new NextRequest("http://localhost", { method: HttpMethod.Post }),
          context,
        )
      ).status,
    ).toBe(200);
    expect(alignProgramDates).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );
    expect(
      (
        await alignDates(
          new NextRequest("http://localhost", { method: HttpMethod.Post }),
          context,
        )
      ).status,
    ).toBe(403);
    expect(alignProgramDates).toHaveBeenCalledTimes(1);
  });

  it("stops at the coordinator check for reading and saving", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect(
      (await GET(new NextRequest("http://localhost"), context)).status,
    ).toBe(403);
    expect((await PUT(put({ weeks: [] }), context)).status).toBe(403);
    expect(fetchProgramWeekPlan).not.toHaveBeenCalled();
    expect(replaceProgramWeekPlan).not.toHaveBeenCalled();
  });

  it("reads the plan as the signed-in coordinator", async () => {
    await GET(new NextRequest("http://localhost"), context);
    expect(fetchProgramWeekPlan).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
  });

  it("saves the whole plan as the session user, trimming lines and dropping blank ones", async () => {
    await PUT(
      put({
        actorId: "someone-else",
        weeks: [
          {
            week: 2,
            title: "Görüşmeler",
            topics: [" Problem ", ""],
            activities: [],
            deliverables: ["Notlar"],
            inferred: false,
            startDate: "2026-10-12",
            endDate: "2026-10-16",
            sessions: [
              {
                date: "2026-10-12",
                startTime: "18:00",
                endTime: "20:00",
                place: "Online",
                title: null,
              },
            ],
          },
        ],
        specialDays: [],
      }),
      context,
    );

    expect(replaceProgramWeekPlan).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [
        {
          week: 2,
          title: "Görüşmeler",
          topics: ["Problem"],
          activities: [],
          deliverables: ["Notlar"],
          inferred: false,
          startDate: "2026-10-12",
          endDate: "2026-10-16",
          sessions: [
            {
              date: "2026-10-12",
              startTime: "18:00",
              endTime: "20:00",
              place: "Online",
              title: null,
            },
          ],
        },
      ],
      [],
    );
  });

  it("saves a week the backend returned without its inferred flag as not inferred", async () => {
    const { inferred: _inferred, ...withoutFlag } = week;
    await PUT(
      put({
        weeks: [withoutFlag, { ...week, week: 3, inferred: null }],
        specialDays: [],
      }),
      context,
    );

    expect(replaceProgramWeekPlan).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [
        expect.objectContaining({ week: week.week, inferred: false }),
        expect.objectContaining({ week: 3, inferred: false }),
      ],
      [],
    );
  });

  it.each([
    ["no weeks", { specialDays: [] }],
    [
      "a week number given as text",
      { weeks: [{ ...week, week: "2" }], specialDays: [] },
    ],
    [
      "activities that are not a list",
      { weeks: [{ ...week, activities: "x" }], specialDays: [] },
    ],
    [
      "a flag that is not a boolean",
      { weeks: [{ ...week, inferred: "yes" }], specialDays: [] },
    ],
    // A page from before the dates existed must not save over them.
    ["no special days", { weeks: [week] }],
    [
      "a week without its sessions",
      {
        weeks: [{ ...week, sessions: undefined }],
        specialDays: [],
      },
    ],
    [
      "a session time that is not a clock time",
      {
        weeks: [
          {
            ...week,
            sessions: [
              {
                date: "2026-10-12",
                startTime: "6pm",
                endTime: null,
                place: null,
                title: null,
              },
            ],
          },
        ],
        specialDays: [],
      },
    ],
    [
      "a special day without a title",
      {
        weeks: [],
        specialDays: [
          {
            date: "2026-12-15",
            startTime: null,
            endTime: null,
            place: null,
            title: " ",
            details: [],
          },
        ],
      },
    ],
  ])(
    "refuses a plan with %s instead of wiping or guessing",
    async (_case, body) => {
      const response = await PUT(put(body), context);

      expect(response.status).toBe(400);
      expect(replaceProgramWeekPlan).not.toHaveBeenCalled();
    },
  );
});
