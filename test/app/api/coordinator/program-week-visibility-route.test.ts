import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/coordinator/programs/[id]/weeks/[week]/visibility/route";
import { WeekVisibility } from "@/interfaces/program-week";
import { UserRole } from "@/interfaces/session";
import { setProgramWeekVisibility } from "@/lib/api/program-weeks";
import { HttpMethod } from "@/lib/http-method";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { planWeek } from "@test/fixtures/program-week";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-weeks", () => ({
  setProgramWeekVisibility: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const contextFor = (week: string) => ({
  params: Promise.resolve({ id: "program-1", week }),
});

function put(body: unknown) {
  return new NextRequest(
    new URL(
      "/api/coordinator/programs/program-1/weeks/3/visibility",
      "http://localhost",
    ),
    { method: HttpMethod.Put, body: JSON.stringify(body) },
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
  vi.mocked(setProgramWeekVisibility).mockResolvedValue(
    backendResponse(
      planWeek({ week: 3, menteeVisibility: WeekVisibility.Shown }),
    ),
  );
});

describe("week visibility proxy", () => {
  it("sets the week's visibility as the session coordinator, ignoring a forged actor", async () => {
    const response = await PUT(
      put({ actorId: "forged", visibility: WeekVisibility.Shown }),
      contextFor("3"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      week: 3,
      menteeVisibility: WeekVisibility.Shown,
    });
    expect(setProgramWeekVisibility).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      3,
      WeekVisibility.Shown,
    );
  });

  it("stops at the coordinator check", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect(
      (await PUT(put({ visibility: WeekVisibility.Hidden }), contextFor("3")))
        .status,
    ).toBe(403);
    expect(setProgramWeekVisibility).not.toHaveBeenCalled();
  });

  it("forwards the backend's refusal for another program's coordinator", async () => {
    vi.mocked(setProgramWeekVisibility).mockResolvedValue(
      backendRefusal(403, { code: "FORBIDDEN" }),
    );

    expect(
      (await PUT(put({ visibility: WeekVisibility.Hidden }), contextFor("3")))
        .status,
    ).toBe(403);
  });

  it.each([
    ["no visibility", {}],
    ["an unknown visibility", { visibility: "EVERYONE" }],
    ["a lower-case visibility", { visibility: "shown" }],
  ])("refuses %s without calling the backend", async (_name, body) => {
    expect((await PUT(put(body), contextFor("3"))).status).toBe(400);
    expect(setProgramWeekVisibility).not.toHaveBeenCalled();
  });

  it("refuses malformed JSON without calling the backend", async () => {
    const request = new NextRequest(
      new URL(
        "/api/coordinator/programs/program-1/weeks/3/visibility",
        "http://localhost",
      ),
      { method: HttpMethod.Put, body: "{not json" },
    );

    expect((await PUT(request, contextFor("3"))).status).toBe(400);
    expect(setProgramWeekVisibility).not.toHaveBeenCalled();
  });

  it.each(["0", "105", "1e2", "0x3", " 3", "üç"])(
    "refuses week %j without calling the backend",
    async (week) => {
      expect(
        (await PUT(put({ visibility: WeekVisibility.Auto }), contextFor(week)))
          .status,
      ).toBe(400);
      expect(setProgramWeekVisibility).not.toHaveBeenCalled();
    },
  );

  it("answers 502 with a translated message when the backend cannot be reached", async () => {
    vi.mocked(setProgramWeekVisibility).mockRejectedValue(new Error("down"));

    const response = await PUT(
      put({ visibility: WeekVisibility.Auto }),
      contextFor("3"),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: "Haftanın görünürlüğü kaydedilemedi.",
    });
  });
});
