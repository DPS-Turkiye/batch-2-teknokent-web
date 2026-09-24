import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/calendar/route";
import { POST } from "@/app/api/coordinator/programs/[id]/events/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import { fetchCoordinatorCalendar } from "@/lib/api/coordinator-calendar";
import { createCoordinatorProgramEvent } from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-calendar", () => ({
  fetchCoordinatorCalendar: vi.fn(),
}));

vi.mock("@/lib/api/coordinator-programs", () => ({
  createCoordinatorProgramEvent: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

function signIn() {
  vi.mocked(requireCoordinatorSession).mockResolvedValue({
    ok: true,
    session: {
      userId: "coordinator-1",
      role: UserRole.Coordinator,
    } as AppSession,
  });
}

describe("coordinator calendar routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for the range as the signed-in coordinator", async () => {
    signIn();
    vi.mocked(fetchCoordinatorCalendar).mockResolvedValue({
      data: {},
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchCoordinatorCalendar>>);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/coordinator/calendar?from=2026-09-14&to=2026-09-20&programId=program-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchCoordinatorCalendar).toHaveBeenCalledWith("coordinator-1", {
      from: "2026-09-14",
      to: "2026-09-20",
      programId: "program-1",
    });
  });

  it("rejects a missing or malformed range before calling the backend", async () => {
    signIn();

    const response = await GET(
      new NextRequest(
        "http://localhost/api/coordinator/calendar?from=yesterday",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchCoordinatorCalendar).not.toHaveBeenCalled();
  });

  it("creates an event as the signed-in coordinator, ignoring a sent actorId", async () => {
    signIn();
    vi.mocked(createCoordinatorProgramEvent).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    } as Awaited<ReturnType<typeof createCoordinatorProgramEvent>>);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          actorId: "someone-else",
          title: "Demo Day",
          kind: "EVENT",
          startsAt: "2026-09-16T07:00:00.000Z",
        }),
      }),
      { params: Promise.resolve({ id: "program-1" }) },
    );

    expect(response.status).toBe(201);
    expect(createCoordinatorProgramEvent).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        title: "Demo Day",
        kind: "EVENT",
        startsAt: "2026-09-16T07:00:00.000Z",
        endsAt: null,
        description: null,
      },
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/coordinator/calendar?from=2026-09-14&to=2026-09-20",
      ),
    );

    expect(response.status).toBe(403);
    expect(fetchCoordinatorCalendar).not.toHaveBeenCalled();
  });
});
