import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as listActions,
  POST as createAction,
} from "@/app/api/action-items/route";
import { PATCH as updateAction } from "@/app/api/action-items/[id]/route";
import { POST as recommendMentorsRoute } from "@/app/api/mentor-recommendations/route";
import { GET as getMentorRequest } from "@/app/api/mentor-requests/[id]/route";
import { PATCH as confirmProfile } from "@/app/api/profile-analysis/[id]/confirmation/route";
import { POST as recommendFromProfile } from "@/app/api/profile-analysis/[id]/recommendations/route";
import {
  createActionItem,
  fetchActionItems,
  updateActionItem,
} from "@/lib/api/action-items";
import { recommendMentors } from "@/lib/api/mentor-recommendations";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import {
  confirmProfileAnalysis,
  recommendFromProfileAnalysis,
} from "@/lib/api/profile-analysis";
import { requireStartupSession } from "@/lib/server/require-program-access";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

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
  recommendFromProfileAnalysis: vi.fn(),
}));
vi.mock("@/lib/server/require-program-access", () => ({
  requireStartupSession: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const request = (method = "GET") =>
  new NextRequest("http://localhost/api/private?requestId=request-1", {
    method,
    ...(method === "GET" ? {} : { body: "{}" }),
  });
const params = { params: Promise.resolve({ id: "item-1" }) };

describe("private API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED" },
        { status: 401 },
      ),
    });
  });

  it("rejects requests without a session before contacting the backend", async () => {
    const responses = await Promise.all([
      listActions(request()),
      createAction(request("POST")),
      updateAction(request("PATCH"), params),
      recommendMentorsRoute(request("POST")),
      getMentorRequest(request(), params),
      confirmProfile(request("PATCH"), params),
      recommendFromProfile(request("POST"), params),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401, 401, 401, 401,
    ]);
    for (const backendCall of [
      createActionItem,
      fetchActionItems,
      updateActionItem,
      recommendMentors,
      fetchMentorRequest,
      confirmProfileAnalysis,
      recommendFromProfileAnalysis,
    ]) {
      expect(backendCall).not.toHaveBeenCalled();
    }
  });
});
