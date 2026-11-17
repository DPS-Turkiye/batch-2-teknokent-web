import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as coordinatorList,
  POST as post,
} from "@/app/api/coordinator/programs/[id]/announcements/route";
import { GET as mine } from "@/app/api/program-announcements/route";
import { AnnouncementAudience } from "@/interfaces/program-announcement";
import { UserRole } from "@/interfaces/session";
import {
  fetchMyAnnouncements,
  fetchProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/api/program-announcements";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { getSessionIds } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-announcements", () => ({
  fetchMyAnnouncements: vi.fn(),
  fetchProgramAnnouncements: vi.fn(),
  postProgramAnnouncement: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const ok = backendResponse([]);
const params = { params: Promise.resolve({ id: "program-1" }) };

describe("program announcement routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });
    answerEachWith(
      [
        fetchMyAnnouncements,
        fetchProgramAnnouncements,
        postProgramAnnouncement,
      ],
      ok,
    );
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
      { body: "Demo Day", audience: AnnouncementAudience.Everyone },
    );
  });

  it("forwards the chosen audience and rejects an unknown one", async () => {
    await post(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          body: "Mentor toplantısı",
          audience: AnnouncementAudience.Participants,
        }),
      }),
      params,
    );
    expect(postProgramAnnouncement).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        body: "Mentor toplantısı",
        audience: AnnouncementAudience.Participants,
      },
    );

    const rejected = await post(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ body: "Duyuru", audience: "ADMINS" }),
      }),
      params,
    );
    expect(rejected.status).toBe(400);
    expect(postProgramAnnouncement).toHaveBeenCalledTimes(1);
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
