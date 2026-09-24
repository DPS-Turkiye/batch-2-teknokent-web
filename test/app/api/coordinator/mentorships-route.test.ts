import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getDetail } from "@/app/api/coordinator/mentorships/[id]/route";
import { POST as remind } from "@/app/api/coordinator/mentorships/[id]/remind/route";
import { GET } from "@/app/api/coordinator/mentorships/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  fetchCoordinatorMentorship,
  fetchCoordinatorMentorships,
  remindCoordinatorMentorship,
} from "@/lib/api/coordinator-mentorships";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-mentorships", () => ({
  fetchCoordinatorMentorships: vi.fn(),
  fetchCoordinatorMentorship: vi.fn(),
  remindCoordinatorMentorship: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = (status = 200) => ({ data: {}, headers: {}, status });
const params = { params: Promise.resolve({ id: "mentorship-1" }) };

function signIn() {
  vi.mocked(requireCoordinatorSession).mockResolvedValue({
    ok: true,
    session: {
      userId: "coordinator-1",
      role: UserRole.Coordinator,
    } as AppSession,
  });
}

describe("coordinator mentorship routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists for the signed-in coordinator and passes the program through", async () => {
    signIn();
    vi.mocked(fetchCoordinatorMentorships).mockResolvedValue(
      ok() as Awaited<ReturnType<typeof fetchCoordinatorMentorships>>,
    );

    const response = await GET(
      new NextRequest(
        "http://localhost/api/coordinator/mentorships?programId=program-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchCoordinatorMentorships).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
  });

  it("opens one mentorship and forwards a reminder's status", async () => {
    signIn();
    vi.mocked(fetchCoordinatorMentorship).mockResolvedValue(
      ok() as Awaited<ReturnType<typeof fetchCoordinatorMentorship>>,
    );
    vi.mocked(remindCoordinatorMentorship).mockResolvedValue(
      ok(400) as Awaited<ReturnType<typeof remindCoordinatorMentorship>>,
    );

    expect(
      (await getDetail(new Request("http://localhost"), params)).status,
    ).toBe(200);
    expect(fetchCoordinatorMentorship).toHaveBeenCalledWith(
      "coordinator-1",
      "mentorship-1",
    );
    expect((await remind(new Request("http://localhost"), params)).status).toBe(
      400,
    );
    expect(remindCoordinatorMentorship).toHaveBeenCalledWith(
      "coordinator-1",
      "mentorship-1",
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    expect((await remind(new Request("http://localhost"), params)).status).toBe(
      403,
    );
    expect(remindCoordinatorMentorship).not.toHaveBeenCalled();
  });
});
