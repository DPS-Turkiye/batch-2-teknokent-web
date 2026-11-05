import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/profile-analysis/records/[id]/route";
import { GET, POST } from "@/app/api/profile-analysis/records/route";
import { getSessionUser } from "@/lib/session";
import {
  fetchProfileAnalysisRecord,
  createStartupProfileRecord,
  confirmStartupProfileRecord,
} from "@/lib/api/profile-analysis-records";
import { UserRole, type AppSession } from "@/interfaces/session";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/profile-analysis-records", () => ({
  fetchProfileAnalysisRecord: vi.fn(),
  createStartupProfileRecord: vi.fn(),
  confirmStartupProfileRecord: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "me",
    organizationId: "team",
    role: UserRole.Mentee,
  } as AppSession);
});
const request = (query: string) =>
  new NextRequest("http://localhost/api/profile-analysis/records?" + query);
describe("scoped profile record proxy", () => {
  it("derives the caller from the session and accepts no subject or organization override", async () => {
    vi.mocked(fetchProfileAnalysisRecord).mockResolvedValue({
      status: 200,
      data: { id: "record" },
      headers: {},
    });
    expect(
      (
        await GET(
          request(
            "scope=PERSONAL&actorId=other&appUserId=other&organizationId=other",
          ),
        )
      ).status,
    ).toBe(200);
    expect(fetchProfileAnalysisRecord).toHaveBeenCalledWith("me", "PERSONAL");
  });
  it("preserves missing-record status for the empty state", async () => {
    vi.mocked(fetchProfileAnalysisRecord).mockResolvedValue({
      status: 404,
      data: {},
      headers: {},
    });
    expect((await GET(request("scope=STARTUP"))).status).toBe(404);
  });
  it("requires a session, startup membership and a recognized scope", async () => {
    expect((await GET(request("scope=unknown"))).status).toBe(400);
    vi.mocked(getSessionUser).mockResolvedValue({
      role: UserRole.Mentor,
    } as AppSession);
    expect((await GET(request("scope=PERSONAL"))).status).toBe(403);
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await GET(request("scope=PERSONAL"))).status).toBe(401);
    expect(fetchProfileAnalysisRecord).not.toHaveBeenCalled();
  });
  it("creates only for the session's startup, ignoring client identity and type overrides", async () => {
    vi.mocked(createStartupProfileRecord).mockResolvedValue({
      status: 201,
      data: { id: "record" },
      headers: {},
    });
    const response = await POST(
      new NextRequest("http://localhost/api/profile-analysis/records", {
        method: "POST",
        body: JSON.stringify({
          profile: { startup_name: "Launch" },
          actorId: "other",
          organizationId: "other",
          appUserId: "other",
          profileType: "individual_mentee",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(createStartupProfileRecord).toHaveBeenCalledWith("me", {
      startup_name: "Launch",
    });
  });
  it("rejects malformed manual input before contacting the backend", async () => {
    for (const body of ["{", '{"profile":null}', '{"profile":[]}']) {
      expect(
        (
          await POST(
            new NextRequest("http://localhost/api/profile-analysis/records", {
              method: "POST",
              body,
            }),
          )
        ).status,
      ).toBe(400);
    }
    expect(createStartupProfileRecord).not.toHaveBeenCalled();
  });
  it("forwards confirmation with session identity and preserves a backend scope refusal", async () => {
    vi.mocked(confirmStartupProfileRecord).mockResolvedValue({
      status: 403,
      data: {},
      headers: {},
    });
    const response = await PATCH(
      new NextRequest(
        "http://localhost/api/profile-analysis/records/record-1",
        {
          method: "PATCH",
          body: JSON.stringify({
            profile: { startup_name: "Reviewed" },
            actorId: "other",
            organizationId: "other",
          }),
        },
      ),
      { params: Promise.resolve({ id: "record-1" }) },
    );
    expect(response.status).toBe(403);
    expect(confirmStartupProfileRecord).toHaveBeenCalledWith("me", "record-1", {
      startup_name: "Reviewed",
    });
  });
});
