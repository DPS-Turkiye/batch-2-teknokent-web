import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/coordinator/programs/[id]/weeks/route";
import type { ProgramWeekPlan } from "@/interfaces/program-week";
import { UserRole } from "@/interfaces/session";
import {
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import { HttpMethod } from "@/lib/http-method";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-weeks", () => ({
  fetchProgramWeekPlan: vi.fn(),
  replaceProgramWeekPlan: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "program-1" }) };
const ok = backendResponse<ProgramWeekPlan>({ totalWeeks: 12, weeks: [] });
/** A valid week, for the cases that break one field of it. */
const week = {
  week: 2,
  title: "Görüşmeler",
  topics: [],
  activities: [],
  deliverables: [],
  inferred: false,
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
  vi.mocked(requireCoordinatorSession).mockResolvedValue({
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
  it("stops at the coordinator check for reading and saving", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

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
          },
        ],
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
        },
      ],
    );
  });

  it("saves a week the backend returned without its inferred flag as not inferred", async () => {
    const { inferred: _inferred, ...withoutFlag } = week;
    await PUT(
      put({ weeks: [withoutFlag, { ...week, week: 3, inferred: null }] }),
      context,
    );

    expect(replaceProgramWeekPlan).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [
        expect.objectContaining({ week: week.week, inferred: false }),
        expect.objectContaining({ week: 3, inferred: false }),
      ],
    );
  });

  it.each([
    ["no weeks", {}],
    ["a week number given as text", { weeks: [{ ...week, week: "2" }] }],
    [
      "activities that are not a list",
      { weeks: [{ ...week, activities: "x" }] },
    ],
    ["a flag that is not a boolean", { weeks: [{ ...week, inferred: "yes" }] }],
  ])(
    "refuses a plan with %s instead of wiping or guessing",
    async (_case, body) => {
      const response = await PUT(put(body), context);

      expect(response.status).toBe(400);
      expect(replaceProgramWeekPlan).not.toHaveBeenCalled();
    },
  );
});
