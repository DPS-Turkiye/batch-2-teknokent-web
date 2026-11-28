import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listDocumentRequestsRoute } from "@/app/api/document-requests/route";
import { PATCH as confirmProfile } from "@/app/api/profile-analysis/[id]/confirmation/route";
import { UserRole } from "@/interfaces/session";
import { fetchDocumentRequests } from "@/lib/api/document-requests";
import { confirmStartupProfileRecord } from "@/lib/api/profile-analysis-records";
import { HttpMethod } from "@/lib/http-method";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds, getSessionUser } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
  getSessionUser: vi.fn(),
}));
vi.mock("@/lib/api/document-requests", () => ({
  fetchDocumentRequests: vi.fn(),
}));
vi.mock("@/lib/api/profile-analysis-records", () => ({
  confirmStartupProfileRecord: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 };
const mentee = {
  userId: "user-1",
  email: "mentee@example.com",
  fullName: "Mentee",
  jobTitle: "",
  role: UserRole.Mentee,
  organizationId: "org-1",
} as const;
const params = { params: Promise.resolve({ id: "target-1" }) };

function request(
  method: HttpMethod,
  body?: unknown,
  headers?: Record<string, string>,
) {
  return new NextRequest("http://localhost/x?requestId=req-1", {
    method,
    ...(headers ? { headers } : {}),
    body: body === undefined ? null : JSON.stringify(body),
  });
}

const cases = [
  {
    name: "PATCH /api/profile-analysis/[id]/confirmation",
    call: () =>
      confirmProfile(request(HttpMethod.Patch, { profile: {} }), params),
    backend: confirmStartupProfileRecord,
  },
  {
    name: "GET /api/document-requests",
    call: () =>
      listDocumentRequestsRoute(
        new NextRequest("http://localhost/x?meetingId=meeting-1"),
      ),
    backend: fetchDocumentRequests,
  },
];

describe("routes that require a session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const { backend } of cases) vi.mocked(backend).mockResolvedValue(ok);
  });

  it.each(cases)("$name answers 401 without a session", async (route) => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await route.call();

    expect(response.status).toBe(401);
    expect(route.backend).not.toHaveBeenCalled();
  });

  it.each(cases)("$name forwards with a session", async (route) => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.mocked(getSessionUser).mockResolvedValue(mentee);

    const response = await route.call();

    expect(response.status).toBe(200);
    expect(route.backend).toHaveBeenCalled();
  });
});
