import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCoordinatorCalendar } from "@/lib/api/coordinator-calendar";
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
    "reads every program's calendar when no program is picked",
    () =>
      fetchCoordinatorCalendar("coord-1", {
        from: "2026-11-01",
        to: "2026-11-30",
        programId: null,
      }),
    {
      method: "GET",
      url: "/api/coordinator/calendar",
      params: { actorId: "coord-1", from: "2026-11-01", to: "2026-11-30" },
    },
  ],
  [
    "narrows the calendar to the picked program",
    () =>
      fetchCoordinatorCalendar("coord-1", {
        from: "2026-11-01",
        to: "2026-11-30",
        programId: "prog-1",
      }),
    {
      method: "GET",
      url: "/api/coordinator/calendar",
      params: {
        actorId: "coord-1",
        from: "2026-11-01",
        to: "2026-11-30",
        programId: "prog-1",
      },
    },
  ],
];

describe("coordinator calendar server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
