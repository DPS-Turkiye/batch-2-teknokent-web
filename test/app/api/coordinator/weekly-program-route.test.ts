import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as readRoute } from "@/app/api/coordinator/programs/[id]/weekly-program/read/route";
import { PUT as saveRoute } from "@/app/api/coordinator/programs/[id]/weekly-program/route";
import { UserRole } from "@/interfaces/session";
import type {
  WeeklyProgramProposal,
  WeeklyProgramSaved,
} from "@/interfaces/weekly-program";
import { readWeeklyProgram, saveWeeklyProgram } from "@/lib/api/weekly-program";
import { HttpMethod } from "@/lib/http-method";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";
import { weeklyProgramProposal } from "@test/fixtures/weekly-program";

vi.mock("@/lib/api/weekly-program", () => ({
  readWeeklyProgram: vi.fn(),
  saveWeeklyProgram: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "program-1" }) };

const validSave = {
  documentId: "doc-1",
  weeks: [
    {
      week: 1,
      title: "Yola Çık",
      topics: [" Oturum ", ""],
      activities: [],
      deliverables: ["Görev"],
      inferred: false,
    },
  ],
  phases: [
    {
      name: "Problemi Keşfet",
      expectedOutput: null,
      firstWeek: 1,
      lastWeek: 3,
    },
  ],
  seenPhaseCount: 0,
  seenWeekCount: 0,
  keepPast: true,
};

function request(
  path: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const read = (body: unknown, headers: Record<string, string> = {}) =>
  readRoute(
    request(
      "/api/coordinator/programs/program-1/weekly-program/read",
      HttpMethod.Post,
      body,
      headers,
    ),
    context,
  );
const save = (body: unknown) =>
  saveRoute(
    request(
      "/api/coordinator/programs/program-1/weekly-program",
      HttpMethod.Put,
      body,
    ),
    context,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({
      userId: "coordinator-1",
      role: UserRole.Coordinator,
    }),
  });
  vi.mocked(readWeeklyProgram).mockResolvedValue(
    backendResponse<WeeklyProgramProposal>(weeklyProgramProposal()),
  );
  vi.mocked(saveWeeklyProgram).mockResolvedValue(
    backendResponse<WeeklyProgramSaved>({
      program: coordinatorProgramDetail(),
      plan: { totalWeeks: 11, weeks: [] },
    }),
  );
});

describe("weekly program proxy", () => {
  it("stops at the coordinator check for reading and saving", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await read({ documentId: "doc-1" })).status).toBe(403);
    expect((await save(validSave)).status).toBe(403);
    expect(readWeeklyProgram).not.toHaveBeenCalled();
    expect(saveWeeklyProgram).not.toHaveBeenCalled();
  });

  it("reads the file as the signed-in coordinator, ignoring a forged actor", async () => {
    const response = await read({
      actorId: "someone-else",
      documentId: "doc-1",
    });

    expect(response.status).toBe(200);
    expect(readWeeklyProgram).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "doc-1",
    );
  });

  it("reads on the service credentials even when the browser sends its token", async () => {
    // The backend refuses a bearer on this path with 403 ("only reachable through the app").
    await read({ documentId: "doc-1" }, { Authorization: "Bearer token-1" });

    expect(readWeeklyProgram).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "doc-1",
    );
  });

  it("saves the reviewed plan as the signed-in coordinator, trimming lines", async () => {
    await save({ ...validSave, actorId: "someone-else" });

    expect(saveWeeklyProgram).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        ...validSave,
        weeks: [{ ...validSave.weeks[0], topics: ["Oturum"] }],
      },
    );
  });

  it.each([
    ["no document", {}],
    ["a document id of the wrong type", { documentId: 7 }],
    ["malformed JSON", "{"],
  ])("refuses a read with %s", async (_case, body) => {
    expect((await read(body)).status).toBe(400);
    expect(readWeeklyProgram).not.toHaveBeenCalled();
  });

  it.each([
    ["no phases", { ...validSave, phases: undefined }],
    [
      "a week number given as text",
      { ...validSave, weeks: [{ ...validSave.weeks[0], week: "1" }] },
    ],
    [
      "a fractional week number",
      { ...validSave, weeks: [{ ...validSave.weeks[0], week: 1.5 }] },
    ],
    [
      "a phase range given as text",
      { ...validSave, phases: [{ name: "A", firstWeek: "1", lastWeek: 2 }] },
    ],
    [
      "a fractional week in a phase",
      { ...validSave, phases: [{ name: "A", firstWeek: 1.5, lastWeek: 2 }] },
    ],
    ["no weeks, which would only wipe the plan", { ...validSave, weeks: [] }],
    ["no count of the plan it saw", { ...validSave, seenWeekCount: undefined }],
    ["a negative count", { ...validSave, seenPhaseCount: -1 }],
    [
      "a keep-past flag that is not a boolean",
      { ...validSave, keepPast: "yes" },
    ],
  ])("refuses a save with %s instead of guessing", async (_case, body) => {
    expect((await save(body)).status).toBe(400);
    expect(saveWeeklyProgram).not.toHaveBeenCalled();
  });

  it("maps a backend failure to a translated error", async () => {
    vi.mocked(readWeeklyProgram).mockRejectedValue(new Error("boom"));

    const response = await read({ documentId: "doc-1" });

    expect(response.status).toBe(502);
  });
});
