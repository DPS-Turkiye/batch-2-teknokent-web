import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/coordinator/programs/[id]/weeks/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import { HttpMethod } from "@/lib/http-method";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/program-weeks", () => ({
  fetchProgramWeekPlan: vi.fn(),
  replaceProgramWeekPlan: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "program-1" }) };
const ok = {
  data: { totalWeeks: 12, weeks: [] },
  headers: {},
  status: 200,
} as never;

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
    session: {
      userId: "coordinator-1",
      role: UserRole.Coordinator,
    } as AppSession,
  });
  vi.mocked(fetchProgramWeekPlan).mockResolvedValue(ok);
  vi.mocked(replaceProgramWeekPlan).mockResolvedValue(ok);
});

describe("coordinator weekly plan proxy", () => {
  it("stops at the coordinator check for reading and saving", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

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

  it("saves the whole plan as the session user, keeping only real lines and a real flag", async () => {
    await PUT(
      put({
        actorId: "someone-else",
        weeks: [
          {
            week: "2",
            title: "Görüşmeler",
            topics: [" Problem ", ""],
            activities: "not a list",
            deliverables: ["Notlar"],
            inferred: "yes",
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
});
