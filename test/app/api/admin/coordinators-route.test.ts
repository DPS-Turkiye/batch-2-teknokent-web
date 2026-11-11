import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/admin/coordinators/[id]/access/route";
import { POST as resendSetup } from "@/app/api/admin/coordinators/[id]/password-setup/route";
import { GET } from "@/app/api/admin/coordinators/candidate/route";
import { POST } from "@/app/api/admin/coordinators/route";
import { UserRole } from "@/interfaces/session";
import {
  addCoordinator,
  fetchCoordinatorCandidate,
  resendCoordinatorPasswordSetup,
  setCoordinatorAccess,
} from "@/lib/api/admin-coordinators";
import { requireAdminSession } from "@/lib/server/require-admin";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-coordinators", () => ({
  fetchCoordinatorCandidate: vi.fn(),
  addCoordinator: vi.fn(),
  setCoordinatorAccess: vi.fn(),
  resendCoordinatorPasswordSetup: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const ok = backendResponse({});

function signIn() {
  vi.mocked(requireAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "admin-1", role: UserRole.Admin }),
  });
}

function json(method: string, body: unknown) {
  return new Request("http://localhost", {
    method,
    body: JSON.stringify(body),
  });
}

describe("admin coordinator routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks, adds and deactivates as the signed-in admin", async () => {
    signIn();
    answerEachWith(
      [fetchCoordinatorCandidate, addCoordinator, setCoordinatorAccess],
      ok,
    );

    await GET(
      new NextRequest(
        "http://localhost/api/admin/coordinators/candidate?email=a%40b.com",
      ),
    );
    expect(fetchCoordinatorCandidate).toHaveBeenCalledWith(
      "admin-1",
      "a@b.com",
    );

    await POST(
      json("POST", {
        fullName: "Elif",
        email: "elif@teknokent.org",
        actorId: "someone",
      }),
    );
    expect(addCoordinator).toHaveBeenCalledWith("admin-1", {
      fullName: "Elif",
      email: "elif@teknokent.org",
    });

    await PUT(json("PUT", { active: false }), {
      params: Promise.resolve({ id: "c-1" }),
    });
    expect(setCoordinatorAccess).toHaveBeenCalledWith("admin-1", "c-1", false);

    answerEachWith([resendCoordinatorPasswordSetup], ok);
    await resendSetup(json("POST", {}), {
      params: Promise.resolve({ id: "c-1" }),
    });
    expect(resendCoordinatorPasswordSetup).toHaveBeenCalledWith(
      "admin-1",
      "c-1",
    );
  });

  it("stops anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    expect(
      (await POST(json("POST", { fullName: "x", email: "x@y.com" }))).status,
    ).toBe(403);
    expect(addCoordinator).not.toHaveBeenCalled();
  });
});
