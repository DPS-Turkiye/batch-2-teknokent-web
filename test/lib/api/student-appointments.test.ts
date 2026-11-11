import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchStudentAppointments } from "@/lib/api/student-appointments";
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
    "lists the student's peer-mentoring appointments",
    () => fetchStudentAppointments("student-1"),
    {
      method: "GET",
      url: "/api/peer-mentoring/appointments",
      params: { actorId: "student-1" },
    },
  ],
];

describe("student appointments server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
