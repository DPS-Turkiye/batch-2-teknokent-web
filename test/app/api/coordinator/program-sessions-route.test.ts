import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as exportSessions } from "@/app/api/coordinator/programs/[id]/sessions/export/route";
import { GET as getSessions } from "@/app/api/coordinator/programs/[id]/sessions/route";
import { SessionsExportFormat } from "@/interfaces/program-report";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  exportProgramSessions,
  fetchProgramSessions,
} from "@/lib/api/program-report";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/program-report", () => ({
  fetchProgramSessions: vi.fn(),
  exportProgramSessions: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };
const base = "http://localhost/api/coordinator/programs/program-1/sessions";

describe("program sessions routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: { userId: "coord-1", role: UserRole.Coordinator } as AppSession,
    });
  });

  it("asks for the range as the signed-in coordinator", async () => {
    vi.mocked(fetchProgramSessions).mockResolvedValue({
      data: {},
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchProgramSessions>>);

    const response = await getSessions(
      new NextRequest(`${base}?from=2026-11-01&to=2026-11-30`),
      params,
    );

    expect(response.status).toBe(200);
    expect(fetchProgramSessions).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      "2026-11-01",
      "2026-11-30",
    );
  });

  it("refuses a missing or malformed day", async () => {
    const response = await getSessions(
      new NextRequest(`${base}?from=2026-11-01&to=30.11.2026`),
      params,
    );

    expect(response.status).toBe(400);
    expect(fetchProgramSessions).not.toHaveBeenCalled();
  });

  it("passes the file through with its name and type", async () => {
    vi.mocked(exportProgramSessions).mockResolvedValue({
      data: new TextEncoder().encode("Rol,Ad Soyad").buffer,
      headers: {
        "content-type": "text/csv; charset=UTF-8",
        "content-disposition":
          'attachment; filename="gorusmeler-2026-11-01-2026-11-30.csv"',
      },
      status: 200,
    } as Awaited<ReturnType<typeof exportProgramSessions>>);

    const response = await exportSessions(
      new NextRequest(
        `${base}/export?from=2026-11-01&to=2026-11-30&format=CSV`,
      ),
      params,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "gorusmeler-2026-11-01-2026-11-30.csv",
    );
    await expect(response.text()).resolves.toBe("Rol,Ad Soyad");
    expect(exportProgramSessions).toHaveBeenCalledWith("coord-1", "program-1", {
      from: "2026-11-01",
      to: "2026-11-30",
      format: SessionsExportFormat.Csv,
    });
  });

  it("refuses an unknown file format", async () => {
    const response = await exportSessions(
      new NextRequest(
        `${base}/export?from=2026-11-01&to=2026-11-30&format=PDF`,
      ),
      params,
    );

    expect(response.status).toBe(400);
    expect(exportProgramSessions).not.toHaveBeenCalled();
  });
});
