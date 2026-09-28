import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as coordinatorList,
  POST as post,
} from "@/app/api/coordinator/programs/[id]/announcements/route";
import { GET as mine } from "@/app/api/program-announcements/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  fetchMyAnnouncements,
  fetchProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/api/program-announcements";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/program-announcements", () => ({
  fetchMyAnnouncements: vi.fn(),
  fetchProgramAnnouncements: vi.fn(),
  postProgramAnnouncement: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const ok = { data: [], headers: {}, status: 200 } as never;
const params = { params: Promise.resolve({ id: "program-1" }) };

describe("program announcement routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });
    vi.mocked(fetchMyAnnouncements).mockResolvedValue(ok);
    vi.mocked(fetchProgramAnnouncements).mockResolvedValue(ok);
    vi.mocked(postProgramAnnouncement).mockResolvedValue(ok);
  });

  it("lets a coordinator read and post a program's announcements", async () => {
    await coordinatorList(new Request("http://localhost"), params);
    await post(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ body: "Demo Day", actorId: "x" }),
      }),
      params,
    );

    expect(fetchProgramAnnouncements).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
    expect(postProgramAnnouncement).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "Demo Day",
    );
  });

  it("gives a team member or mentor their own announcements, and needs a session", async () => {
    await mine();
    expect(fetchMyAnnouncements).toHaveBeenCalledWith("mentee-1");

    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });
    expect((await mine()).status).toBe(401);
  });
});
