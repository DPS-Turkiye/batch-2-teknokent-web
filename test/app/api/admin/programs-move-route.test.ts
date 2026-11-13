import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/programs/[id]/startups/[targetId]/move/route";
import { UserRole } from "@/interfaces/session";
import * as members from "@/lib/api/admin-program-members";
import { requireAdminSession } from "@/lib/server/require-admin";
import tr from "@/messages/tr.json";
import {
  answerAllWith200,
  itChecksTheBody,
  jsonRequest,
  type BodyCase,
} from "@test/app/api/body-validation";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { backendRefusal, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-program-members");
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const FROM_PROGRAM = "5d0c1e6a-0f43-4c4b-9a54-6f2d6c1b7e21";
const context = {
  params: Promise.resolve({ id: "program-2", targetId: "org-1" }),
};

function send(body: unknown) {
  return POST(jsonRequest(body), context);
}

const cases: BodyCase[] = [
  {
    route: "POST /api/admin/programs/[id]/startups/[targetId]/move",
    send: (request) => POST(request, context),
    // The actor is the signed-in admin, whatever the body claims.
    valid: withForgedActor({ fromProgramId: FROM_PROGRAM }),
    backend: members.moveStartupToProgram,
    expected: ["admin-1", "program-2", "org-1", FROM_PROGRAM],
    invalid: {
      "an empty body": "",
      "a body without the program to leave": {},
      "a program that is not an id": { fromProgramId: "program-1" },
      "a program given as a number": { fromProgramId: 7 },
    },
  },
];

describe("POST /api/admin/programs/[id]/startups/[targetId]/move", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answerAllWith200(members);
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "admin-1", role: UserRole.Admin }),
    });
  });

  describe.each(cases)("$route", (bodyCase) => {
    itChecksTheBody(bodyCase);
  });

  it("stops anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await send({ fromProgramId: FROM_PROGRAM });

    expect(response.status).toBe(403);
    expect(members.moveStartupToProgram).not.toHaveBeenCalled();
  });

  it("passes the backend's refusal on", async () => {
    vi.mocked(members.moveStartupToProgram).mockResolvedValue(
      backendRefusal(400, {
        code: "INVALID_REQUEST",
        message: "Bu program artık katılıma açık değil.",
      }),
    );

    const response = await send({ fromProgramId: FROM_PROGRAM });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Bu program artık katılıma açık değil.",
    });
  });

  it("answers its own message when the backend cannot be reached", async () => {
    vi.mocked(members.moveStartupToProgram).mockRejectedValue(
      new Error("socket hang up"),
    );

    const response = await send({ fromProgramId: FROM_PROGRAM });

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: tr.apiErrors.programMoveFailed,
    });
  });
});
