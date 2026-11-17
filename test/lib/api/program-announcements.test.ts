import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnnouncementAudience } from "@/interfaces/program-announcement";
import {
  fetchMyAnnouncements,
  fetchProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/api/program-announcements";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists an encoded program's announcements",
    () => fetchProgramAnnouncements("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/announcements",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "posts an announcement with its body and audience",
    () =>
      postProgramAnnouncement("coord-1", "prog/1", {
        body: "Demo günü cuma",
        audience: AnnouncementAudience.Mentors,
      }),
    {
      method: "POST",
      url: "/api/coordinator/programs/prog%2F1/announcements",
      data: {
        actorId: "coord-1",
        body: "Demo günü cuma",
        audience: AnnouncementAudience.Mentors,
      },
    },
  ],
  [
    "lists the announcements the actor received",
    () => fetchMyAnnouncements("member-1"),
    {
      method: "GET",
      url: "/api/program-announcements",
      params: { actorId: "member-1" },
    },
  ],
];

describe("program announcements server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
