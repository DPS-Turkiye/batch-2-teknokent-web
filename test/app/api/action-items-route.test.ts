import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/action-items/route";
import {
  fetchActionItems,
  fetchActionItemsForRequests,
} from "@/lib/api/action-items";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/action-items", () => ({
  fetchActionItems: vi.fn(),
  fetchActionItemsForRequests: vi.fn(),
  createActionItem: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const ok = { data: [], headers: {}, status: 200 } as Awaited<
  ReturnType<typeof fetchActionItems>
>;

describe("GET /api/action-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "u-1",
      organizationId: "org-1",
    } as Awaited<ReturnType<typeof getSessionIds>>);
    vi.mocked(fetchActionItems).mockResolvedValue(ok);
    vi.mocked(fetchActionItemsForRequests).mockResolvedValue(ok);
  });

  it("asks the backend once for several requests", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/action-items?requestIds=r1,r2"),
    );

    expect(response.status).toBe(200);
    expect(fetchActionItemsForRequests).toHaveBeenCalledWith(["r1", "r2"]);
    expect(fetchActionItems).not.toHaveBeenCalled();
  });

  it("still answers a single request", async () => {
    await GET(
      new NextRequest("http://localhost/api/action-items?requestId=r1"),
    );

    expect(fetchActionItems).toHaveBeenCalledWith("r1");
    expect(fetchActionItemsForRequests).not.toHaveBeenCalled();
  });
});
