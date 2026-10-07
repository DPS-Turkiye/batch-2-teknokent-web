import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH as patchActionItem } from "@/app/api/action-items/[id]/route";
import {
  GET as listActionItems,
  POST as createActionItemRoute,
} from "@/app/api/action-items/route";
import { POST as addBotRoute } from "@/app/api/botapi/route";
import { GET as listDocumentRequestsRoute } from "@/app/api/document-requests/route";
import { POST as recommendMentorsRoute } from "@/app/api/mentor-recommendations/route";
import { GET as getMentorRequest } from "@/app/api/mentor-requests/[id]/route";
import { PATCH as confirmProfile } from "@/app/api/profile-analysis/[id]/confirmation/route";
import { GET as transcriptRoute } from "@/app/api/transcriptapi/route";
import {
  createActionItem,
  fetchActionItems,
  updateActionItem,
} from "@/lib/api/action-items";
import { fetchDocumentRequests } from "@/lib/api/document-requests";
import { recommendMentors } from "@/lib/api/mentor-recommendations";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { confirmProfileAnalysis } from "@/lib/api/profile-analysis";
import { createMeetingBot } from "@/lib/botapi";
import { HttpMethod } from "@/lib/http-method";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
}));
vi.mock("@/lib/botapi", () => ({ createMeetingBot: vi.fn() }));
vi.mock("@/lib/transcriptapi", () => ({ fetchMeetingTranscript: vi.fn() }));
vi.mock("@/lib/api/document-requests", () => ({
  fetchDocumentRequests: vi.fn(),
}));
vi.mock("@/lib/api/action-items", () => ({
  createActionItem: vi.fn(),
  fetchActionItems: vi.fn(),
  updateActionItem: vi.fn(),
}));
vi.mock("@/lib/api/mentor-recommendations", () => ({
  recommendMentors: vi.fn(),
}));
vi.mock("@/lib/api/mentor-requests", () => ({ fetchMentorRequest: vi.fn() }));
vi.mock("@/lib/api/profile-analysis", () => ({
  confirmProfileAnalysis: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 };
const params = { params: Promise.resolve({ id: "target-1" }) };

function request(method: HttpMethod, body?: unknown) {
  return new NextRequest("http://localhost/x?requestId=req-1", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const cases = [
  {
    name: "GET /api/mentor-requests/[id]",
    call: () => getMentorRequest(request(HttpMethod.Get), params),
    backend: fetchMentorRequest,
  },
  {
    name: "GET /api/action-items",
    call: () => listActionItems(request(HttpMethod.Get)),
    backend: fetchActionItems,
  },
  {
    name: "POST /api/action-items",
    call: () =>
      createActionItemRoute(request(HttpMethod.Post, { requestId: "req-1" })),
    backend: createActionItem,
  },
  {
    name: "PATCH /api/action-items/[id]",
    call: () =>
      patchActionItem(
        request(HttpMethod.Patch, { requestId: "req-1" }),
        params,
      ),
    backend: updateActionItem,
  },
  {
    name: "PATCH /api/profile-analysis/[id]/confirmation",
    call: () =>
      confirmProfile(request(HttpMethod.Patch, { profile: {} }), params),
    backend: confirmProfileAnalysis,
  },
  {
    name: "POST /api/mentor-recommendations",
    call: () => recommendMentorsRoute(request(HttpMethod.Post, {})),
    backend: recommendMentors,
  },
  {
    name: "POST /api/botapi",
    call: () =>
      addBotRoute(
        request(HttpMethod.Post, {
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      ),
    backend: createMeetingBot,
  },
  {
    name: "GET /api/transcriptapi",
    call: () =>
      transcriptRoute(
        new NextRequest(
          "http://localhost/x?platform=google_meet&nativeMeetingId=abc-defg-hij",
        ),
      ),
    backend: fetchMeetingTranscript,
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

    const response = await route.call();

    expect(response.status).toBe(401);
    expect(route.backend).not.toHaveBeenCalled();
  });

  it.each(cases)("$name forwards with a session", async (route) => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });

    const response = await route.call();

    expect(response.status).toBe(200);
    expect(route.backend).toHaveBeenCalled();
  });
});
