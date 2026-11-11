import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createProgram,
  decideProgramInvitation,
  fetchMemberProgramEvents,
  fetchOrganizationPrograms,
  fetchProgramDetail,
  fetchProgramInvitations,
  fetchProgramNames,
  fetchPrograms,
  updateActiveProgram,
} from "@/lib/api/programs";
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
    "lists the actor's programs",
    () => fetchPrograms("mentor-1"),
    { method: "GET", url: "/api/programs", params: { actorId: "mentor-1" } },
  ],
  [
    "reads one program at its encoded path",
    () => fetchProgramDetail("prog/1", "mentor-1"),
    {
      method: "GET",
      url: "/api/programs/prog%2F1",
      params: { actorId: "mentor-1" },
    },
  ],
  [
    "lists program names without an actor for the public signup",
    () => fetchProgramNames(),
    { method: "GET", url: "/api/programs/names" },
  ],
  [
    "lists the member's program events within the range",
    () =>
      fetchMemberProgramEvents("member-1", {
        from: "2026-11-01",
        to: "2026-11-30",
      }),
    {
      method: "GET",
      url: "/api/programs/events",
      params: { actorId: "member-1", from: "2026-11-01", to: "2026-11-30" },
    },
  ],
  [
    "lists the startup's programs",
    () => fetchOrganizationPrograms("member-1"),
    {
      method: "GET",
      url: "/api/programs/mine",
      params: { actorId: "member-1" },
    },
  ],
  [
    "switches the active program",
    () => updateActiveProgram("member-1", "prog-2"),
    {
      method: "PUT",
      url: "/api/programs/mine/active",
      data: { actorId: "member-1", programId: "prog-2" },
    },
  ],
  [
    "clears the active program with null",
    () => updateActiveProgram("member-1", null),
    {
      method: "PUT",
      url: "/api/programs/mine/active",
      data: { actorId: "member-1", programId: null },
    },
  ],
  [
    "lists the mentor's program invitations",
    () => fetchProgramInvitations("mentor-1"),
    {
      method: "GET",
      url: "/api/programs/invitations",
      params: { actorId: "mentor-1" },
    },
  ],
  [
    "creates a program by name",
    () => createProgram("coord-1", "Kuluçka"),
    {
      method: "POST",
      url: "/api/programs",
      data: { actorId: "coord-1", name: "Kuluçka" },
    },
  ],
  [
    "answers a program invitation at the encoded program's path",
    () => decideProgramInvitation("mentor-1", "prog/1", true),
    {
      method: "POST",
      url: "/api/programs/prog%2F1/invitations/decide",
      data: { actorId: "mentor-1", accepted: true },
    },
  ],
];

describe("programs server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
