import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/action-items/[id]/route";
import { GET } from "@/app/api/action-items/route";
import { UserRole } from "@/interfaces/session";
import {
  fetchActionItems,
  fetchActionItemsForRequests,
  fetchOrganizationActionItems,
  updateActionItem,
} from "@/lib/api/action-items";
import { HttpMethod } from "@/lib/http-method";
import { getSessionUser } from "@/lib/session";
import { backendResponse } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/action-items", () => ({
  fetchActionItems: vi.fn(),
  fetchOrganizationActionItems: vi.fn(),
  fetchActionItemsForRequests: vi.fn(),
  updateActionItem: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

const ok = backendResponse([]);

function session(role: UserRole, organizationId?: string) {
  const user = appSession({ userId: "u-1", role });
  return organizationId === undefined ? user : { ...user, organizationId };
}

function patch(body: unknown) {
  return PATCH(
    new NextRequest("http://localhost/api/action-items/item-1", {
      method: HttpMethod.Patch,
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "item-1" }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchActionItems).mockResolvedValue(ok);
  vi.mocked(fetchActionItemsForRequests).mockResolvedValue(ok);
  vi.mocked(updateActionItem).mockResolvedValue(ok);
});

describe("GET /api/action-items", () => {
  it("asks the backend once for several requests, as the mentee's startup", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(
      session(UserRole.Mentee, "org-1"),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/action-items?requestIds=r1,r2"),
    );

    expect(response.status).toBe(200);
    expect(fetchActionItemsForRequests).toHaveBeenCalledWith(["r1", "r2"], {
      organizationId: "org-1",
    });
    expect(fetchActionItems).not.toHaveBeenCalled();
  });

  it("asks for a single request as the mentor", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session(UserRole.Mentor));

    await GET(
      new NextRequest("http://localhost/api/action-items?requestId=r1"),
    );

    expect(fetchActionItems).toHaveBeenCalledWith("r1", { mentorId: "u-1" });
    expect(fetchActionItemsForRequests).not.toHaveBeenCalled();
  });

  it("refuses other roles without calling the backend", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session(UserRole.Admin));

    const response = await GET(
      new NextRequest("http://localhost/api/action-items?requestId=r1"),
    );

    expect(response.status).toBe(403);
    expect(fetchActionItems).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/action-items/[id]", () => {
  it("edits within the mentee's own startup, whatever request the body names", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(
      session(UserRole.Mentee, "org-1"),
    );

    const response = await patch({ requestId: "someone-elses", status: "X" });

    expect(response.status).toBe(200);
    expect(updateActionItem).toHaveBeenCalledWith(
      "item-1",
      "org-1",
      expect.anything(),
    );
  });

  it("refuses mentors", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session(UserRole.Mentor));

    const response = await patch({ status: "X" });

    expect(response.status).toBe(403);
    expect(updateActionItem).not.toHaveBeenCalled();
  });
});

it("loads organization tasks using the session organization, ignoring a supplied organization", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(
    session(UserRole.Mentee, "own-org"),
  );
  vi.mocked(fetchOrganizationActionItems).mockResolvedValue(ok);
  const response = await GET(
    new NextRequest(
      "http://localhost/api/action-items?scope=organization&organizationId=other-org",
    ),
  );
  expect(response.status).toBe(200);
  expect(fetchOrganizationActionItems).toHaveBeenCalledWith("own-org");
});
